import type {
  Attachment,
  CoreAssistantMessage,
  CoreMessage,
  CoreToolMessage,
  Message,
} from 'ai';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import type { Message as DBMessage, Document } from '@/lib/db/schema';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ApplicationError extends Error {
  info: string;
  status: number;
}

export const fetcher = async (url: string) => {
  const res = await fetch(url);

  if (!res.ok) {
    const error = new Error(
      'An error occurred while fetching the data.',
    ) as ApplicationError;

    error.info = await res.json();
    error.status = res.status;

    throw error;
  }

  return res.json();
};

export function getLocalStorage(key: string) {
  if (typeof window !== 'undefined') {
    return JSON.parse(localStorage.getItem(key) || '[]');
  }
  return [];
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function addToolMessageToChat({
  toolMessage,
  messages,
}: {
  toolMessage: CoreToolMessage;
  messages: Array<Message>;
}): Array<Message> {
  return messages.map((message) => {
    return {
      ...message,
      parts: message.parts?.map((part) => {
        if (part.type === 'tool-invocation') {
          const toolResult = toolMessage.content.find(
            (tool) => tool.toolCallId === part.toolInvocation.toolCallId,
          );
          if (toolResult) {
            return {
              ...part,
              toolInvocation: {
                ...part.toolInvocation,
                state: 'result',
                result: toolResult.result,
              },
            };
          }
        }
        return part;
      }),
    };
  });
}

export function convertToUIMessages(
  messages: Array<DBMessage>,
): Array<Message> {
  const toolMessages = messages.filter((message) => message.role === 'tool');
  const chatMessages = messages.reduce(
    (chatMessages: Array<Message>, message) => {
      if (message.role === 'tool') {
        return chatMessages;
      }

      const parts: Message['parts'] = [];
      const attachments: Attachment[] = [];

      if (
        typeof message.content === 'string' ||
        typeof message.content === 'number'
      ) {
        parts.push({
          type: 'text',
          text: String(message.content),
        });
      } else if (Array.isArray(message.content)) {
        for (const content of message.content) {
          if (content.type === 'text') {
            parts.push({
              type: 'text',
              text: content.text,
            });
          } else if (content.type === 'tool-call') {
            parts.push({
              type: 'tool-invocation',
              toolInvocation: {
                state: content.state,
                toolCallId: content.toolCallId,
                toolName: content.toolName,
                args: content.args,
              },
            });
          } else if (content.type === 'reasoning') {
            parts.push({
              type: 'reasoning',
              reasoning: content.reasoning,
              details: content.details,
            });
          } else if (content.type === 'image') {
            attachments.push({
              name: content.name,
              url: content.image,
              contentType: content.mimeType,
            });
          }
        }
      }

      chatMessages.push({
        parts,
        id: message.id,
        role: message.role as Message['role'],
        content:
          typeof message.content === 'string'
            ? message.content
            : parts.find((part) => part.type === 'text')?.text || '',
        experimental_attachments:
          attachments.length > 0 ? attachments : undefined,
      });

      return chatMessages;
    },
    [],
  );

  return toolMessages.reduce((messages, toolMessage) => {
    return addToolMessageToChat({
      toolMessage: toolMessage as CoreToolMessage,
      messages,
    });
  }, chatMessages);
}

type ResponseMessageWithoutId = CoreToolMessage | CoreAssistantMessage;
type ResponseMessage = ResponseMessageWithoutId & { id: string };

export function sanitizeResponseMessages({
  messages,
  reasoning,
}: {
  messages: Array<ResponseMessage>;
  reasoning: string | undefined;
}) {
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
        : content.type === 'text'
          ? content.text.length > 0
          : true,
    );

    if (reasoning) {
      // @ts-expect-error: reasoning message parts in sdk is wip
      sanitizedContent.push({ type: 'reasoning', reasoning });
    }

    return {
      ...message,
      content: sanitizedContent,
    };
  });

  return messagesBySanitizedContent.filter(
    (message) => message.content.length > 0,
  );
}

export function sanitizeUIMessages(messages: Array<Message>): Array<Message> {
  const messagesBySanitizedToolInvocations = messages.map((message) => {
    if (message.role !== 'assistant') return message;

    if (!message.parts) return message;

    const toolResultIds: Array<string> = [];

    for (const part of message.parts) {
      if (
        part.type === 'tool-invocation' &&
        part.toolInvocation.state === 'result'
      ) {
        toolResultIds.push(part.toolInvocation.toolCallId);
      }
    }

    const sanitizedToolInvocations = message.parts?.filter(
      (part) =>
        part.type !== 'tool-invocation' ||
        part.toolInvocation.state === 'result' ||
        toolResultIds.includes(part.toolInvocation.toolCallId),
    );

    return {
      ...message,
      parts: sanitizedToolInvocations,
    };
  });

  return messagesBySanitizedToolInvocations.filter(
    (message) =>
      message.content.length > 0 || (message.parts && message.parts.length > 0),
  );
}

export function getMostRecentUserMessage(messages: Array<CoreMessage>) {
  const userMessages = messages.filter((message) => message.role === 'user');
  return userMessages.at(-1);
}

export function hasAttachment(messages: Array<Message>) {
  return messages.some(
    (message) =>
      message.role === 'user' &&
      message.experimental_attachments &&
      message.experimental_attachments.length > 0,
  );
}

export function getDocumentTimestampByIndex(
  documents: Array<Document>,
  index: number,
) {
  if (!documents) return new Date();
  if (index > documents.length) return new Date();

  return documents[index].createdAt;
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

export function getDynamicBlockNames(
  isPublic: boolean,
  dynamicBlocks: { name: string; visibility: 'private' | 'public' }[],
) {
  return dynamicBlocks
    .filter(
      ({ visibility }) => visibility === (isPublic ? 'public' : 'private'),
    )
    .map(({ name }) => name);
}

export function validateUUID(id: string) {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
    id,
  );
}
