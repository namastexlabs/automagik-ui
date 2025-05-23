import 'server-only';
import type {
  CoreAssistantMessage,
  CoreMessage,
  CoreToolMessage,
  CoreUserMessage,
  Message,
} from 'ai';
import type { AnyColumn, GetColumnData, SQL } from 'drizzle-orm';

import type { Message as DBMessage } from '@/lib/db/schema';

import {
  copyMessageFile,
  deleteMessageFile,
  getMessageFile,
  isKeyWithChatId,
  isSignedUrlExpired,
} from '@/lib/services/minio';

export function convertToUIMessages(messages: Array<DBMessage>): Message[] {
  return messages.map((dbMessage): Message => {
    return {
      id: dbMessage.id,
      role: dbMessage.role,
      createdAt: dbMessage.createdAt,
      ...dbMessage.content,
    };
  });
}

type ResponseMessageWithoutId = CoreToolMessage | CoreAssistantMessage;
type ResponseMessage = ResponseMessageWithoutId & { id: string };

export function sanitizeResponseMessages({
  messages,
}: {
  messages: ResponseMessage[];
}): ResponseMessage[] {
  const toolResultIds: Array<string> = [];

  for (const message of messages) {
    if (message.role === 'tool') {
      for (const content of message.content) {
        if (content.type === 'tool-result') {
          toolResultIds.push(content.toolCallId);
        }
      }
    }
  }

  const messagesBySanitizedContent = messages.map((message) => {
    if (message.role !== 'assistant') return message;

    if (typeof message.content === 'string') return message;

    const sanitizedContent = message.content.filter((content) =>
      content.type === 'tool-call'
        ? toolResultIds.includes(content.toolCallId)
        : content.type === 'text' || content.type === 'reasoning'
          ? content.text.length > 0
          : true,
    );

    return {
      ...message,
      content: sanitizedContent,
    };
  });

  return messagesBySanitizedContent.filter(
    (message) => message.content.length > 0,
  );
}

export function hasAttachment(messages: Message[]) {
  return messages.some(
    (message) =>
      message.role === 'user' &&
      message.experimental_attachments &&
      message.experimental_attachments.length > 0,
  );
}

export async function moveAttachmentToChat(name: string, chatId: string) {
  await copyMessageFile(name, name, undefined, chatId);
  await deleteMessageFile(name);

  return getMessageFile(name, chatId);
}

export async function convertAttachmentUrls(message: Message, chatId?: string) {
  const attachments = message.experimental_attachments;
  if (message.role === 'user' && attachments && attachments?.length > 0) {
    return {
      ...message,
      experimental_attachments: await Promise.all(
        attachments.map(async (attachment) =>
          attachment.name
            ? {
                name: attachment.name,
                contentType: attachment.contentType,
                url: isSignedUrlExpired(attachment.url)
                  ? await getMessageFile(attachment.name, chatId)
                  : attachment.url,
              }
            : attachment,
        ),
      ),
    };
  }

  return message;
}

export async function convertCoreMessageAttachments(
  userMessage: CoreUserMessage,
  chatId: string,
) {
  if (!Array.isArray(userMessage.content)) {
    return userMessage;
  }

  return {
    ...userMessage,
    content: await Promise.all(
      userMessage.content.map(async (content) => {
        if (content.type === 'image' && content.image instanceof URL) {
          const name = content.image.pathname.split('/').pop() as string;
          return {
            ...content,
            mimeType: `image/${name.split('.').pop() as string}`,
            image: isKeyWithChatId(content.image.pathname)
              ? isSignedUrlExpired(content.image.href)
                ? new URL(await getMessageFile(name, chatId))
                : content.image
              : new URL(await moveAttachmentToChat(name, chatId)),
          };
        }

        return content;
      }),
    ),
  };
}

export function handleClaudeReasoning(message: CoreMessage) {
  if (message.role === 'assistant' && Array.isArray(message.content)) {
    const reasoningParts = message.content.filter(
      (content) => content.type === 'reasoning',
    );

    const textPartIndex = message.content.findIndex(
      (content) => content.type === 'text',
    );

    return {
      ...message,
      content: message.content
        .filter((content) => content.type !== 'reasoning')
        .map((part, index) => {
          if (index === textPartIndex) {
            const text = reasoningParts
              .map((part) => `<thinking>${part.text}</thinking>`)
              .join('\n');
            return {
              text,
              type: 'text' as const,
            };
          }

          return part;
        }),
    };
  }

  return message;
}

export function handleAnthropicEmptyContent(messages: CoreMessage[]) {
  return messages.reduce<CoreMessage[]>((acc, message) => {
    switch (message.role) {
      case 'system':
      case 'tool': {
        acc.push(message);
        break;
      }
      case 'assistant':
      case 'user': {
        if (!Array.isArray(message.content)) {
          if (message.content.trim().length > 0) {
            acc.push(message);
          }
        } else {
          // Filter out empty text/reasoning content
          const filteredContent = message.content.filter((content) => {
            const isReasoningOrText =
              content.type === 'text' || content.type === 'reasoning';

            if (!isReasoningOrText) return true;
            return content.text.trim().length > 0;
          });

          if (filteredContent.length > 0) {
            acc.push({
              ...message,
              content: filteredContent,
            } as CoreMessage);
          }
        }
        break;
      }
    }
    return acc;
  }, []);
}

export async function sanitizeMessages(
  messages: CoreMessage[],
  provider: string,
  modelId: string,
  chatId: string,
): Promise<CoreMessage[]> {
  let result = messages;
  if (provider === 'anthropic') {
    /*
     * Claude has thinking XML tags and Extended thinking which conflicts on AI SDK
     * This function removes the reasoning messages from the array back to XML thiking tags
     */
    if (!modelId.includes('claude-3-7-sonnet')) {
      result = messages.map(handleClaudeReasoning);
    }

    // Anthropic doesn't allow empty content messages
    result = handleAnthropicEmptyContent(result);
  }

  result = await Promise.all(
    messages.map(async (message) => {
      if (message.role === 'user') {
        return convertCoreMessageAttachments(message, chatId);
      }
      return message;
    }),
  );

  return result;
}

export function getDiffRelation<PREVIOUS, CURRENT>(
  prevItems: PREVIOUS[],
  items: CURRENT[],
  equalTo: (a: PREVIOUS, b: CURRENT) => boolean,
) {
  const newItems = items.filter(
    (item) => !prevItems.some((prevItem) => equalTo(prevItem, item)),
  );
  const deletedItems = prevItems.filter(
    (prevItem) => !items.some((item) => equalTo(prevItem, item)),
  );

  return [deletedItems, newItems] as const;
}

export const aliasedColumn = <T extends AnyColumn>(
  column: T,
  alias: string,
): SQL.Aliased<GetColumnData<T>> => {
  return column.getSQL().mapWith(column.mapFromDriverValue).as(alias);
};
