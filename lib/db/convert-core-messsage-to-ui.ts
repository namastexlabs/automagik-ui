import 'server-only';
import { config } from 'dotenv';
import type { MessageContent, Message as MessageDB } from './schema';
import type {
  Attachment,
  CoreMessage,
  CoreToolMessage,
  Message,
  ToolInvocation,
  ToolResultPart,
} from 'ai';

config({
  path: '.env.local',
});

function convertCoreContentToUIMessage(
  content: CoreMessage['content'] | string,
): MessageContent {
  if (typeof content === 'string') {
    return {
      content,
      parts: [{ type: 'text', text: content }],
    };
  }

  const parts: Message['parts'] = [];

  const attachments: Attachment[] = [];
  const textContent: string[] = [];

  for (const part of content) {
    switch (part.type) {
      case 'text':
        parts.push({ type: 'text', text: part.text });
        textContent.push(part.text);
        break;

      case 'image': {
        const imageUrl =
          part.image instanceof URL
            ? part.image.toString()
            : typeof part.image === 'string'
              ? part.image
              : // Convert Buffer/Uint8Array to base64 if needed
                Buffer.isBuffer(part.image)
                ? `data:${part.mimeType || 'image/png'};base64,${part.image.toString('base64')}`
                : '';

        attachments.push({
          contentType: part.mimeType,
          url: imageUrl,
        });
        break;
      }
      case 'file': {
        const fileUrl =
          part.data instanceof URL
            ? part.data.toString()
            : typeof part.data === 'string'
              ? part.data
              : Buffer.isBuffer(part.data)
                ? `data:${part.mimeType};base64,${part.data.toString('base64')}`
                : '';

        attachments.push({
          contentType: part.mimeType,
          url: fileUrl,
        });
        break;
      }
      case 'reasoning':
        parts.push({
          type: 'reasoning',
          reasoning: part.text,
          details: [
            {
              type: 'text',
              text: part.text,
              signature: part.signature,
            },
          ],
        });
        textContent.push(`[Reasoning: ${part.text}]`);
        break;
      case 'redacted-reasoning':
        parts.push({
          type: 'reasoning',
          reasoning: '[Redacted reasoning]',
          details: [
            {
              type: 'redacted',
              data: part.data,
            },
          ],
        });
        textContent.push('[Redacted reasoning]');
        break;
      case 'tool-call': {
        const toolCall: ToolInvocation = {
          state: 'call',
          toolName: part.toolName,
          toolCallId: part.toolCallId,
          args: part.args,
        };
        parts.push({
          type: 'tool-invocation',
          toolInvocation: toolCall,
        });
        textContent.push(`[Tool Call: ${part.toolName}]`);
        break;
      }
    }
  }

  return {
    content: textContent.join('\n'),
    parts,
    ...(attachments.length > 0 && { experimental_attachments: attachments }),
  };
}

async function processMessage(
  message: MessageDB | string,
  toolMessages: MessageDB[],
  deleteMessage: ({ id }: { id: string }) => Promise<any>,
): Promise<MessageContent> {
  if (['string', 'number'].includes(typeof message)) {
    return {
      content: String(message),
      parts: [
        {
          type: 'text',
          text: String(message),
        },
      ],
    };
  }

  if (['string', 'number'].includes(typeof (message as any).content)) {
    return {
      content: String((message as any).content),
      parts: [
        {
          type: 'text',
          text: String((message as any).content),
        },
      ],
    };
  }
  const content = (message as any).content as unknown as MessageContent;
  if (Object.hasOwn(content, 'parts')) {
    return content as MessageContent;
  }

  const oldContent = content as unknown as
    | CoreMessage['content']
    | string;

  // Convert assistant message content
  const converted = convertCoreContentToUIMessage(oldContent);

  return {
    content: converted.content,
    parts:
      converted.parts &&
      (await Promise.all(
        converted.parts.map(async (part) => {
          if (part.type !== 'tool-invocation') {
            return part;
          }

          let toolMessageId: string | undefined;
          let toolResult: ToolResultPart | undefined;
          toolMessages.forEach((c) => {
            const content = c.content as unknown as CoreToolMessage['content'];
            const found = content.find(
              (p) => p.toolCallId === part.toolInvocation.toolCallId,
            );

            if (found) {
              toolResult = found;
              toolMessageId = c.id;
            }
          });

          if (!toolResult || !toolMessageId) {
            return part;
          }

          const toolInvocation: ToolInvocation = {
            state: 'result',
            toolName: part.toolInvocation.toolName,
            toolCallId: part.toolInvocation.toolCallId,
            result: toolResult.result,
            args: part.toolInvocation.args,
          };

          await deleteMessage({ id: toolMessageId });

          return {
            type: 'tool-invocation' as const,
            toolInvocation,
          };
        }),
      )),
    ...(converted.experimental_attachments && {
      experimental_attachments: converted.experimental_attachments,
    }),
  };
}

const run = async () => {
  const { getMessages, updateMessage, deleteMessage } = await import(
    './queries'
  );

  const messages = await getMessages();
  const start = Date.now();
  let updateCount = 0;
  // Group messages by chatId for easier processing
  const messagesByChat = messages.reduce(
    (acc, msg) => {
      if (!acc[msg.chatId]) {
        acc[msg.chatId] = [];
      }
      acc[msg.chatId].push(msg);
      return acc;
    },
    {} as Record<string, typeof messages>,
  );

  // Process each chat's messages
  for (const chatId of Object.keys(messagesByChat)) {
    const chatMessages = messagesByChat[chatId].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );

    const toolMessages = chatMessages.filter(
      (msg) => (msg as any).role === 'tool',
    );

    // First pass: collect tool messages and their corresponding assistant messages
    for (const message of chatMessages) {
      if ((message as any).role !== 'tool') {
        const content = await processMessage(
          message,
          toolMessages,
          deleteMessage,
        );
        await updateMessage(message.id, content as any);
        updateCount++;
      }
    }
  }

  const end = Date.now();
  console.log(`✅ Updated ${updateCount} messages in ${end - start}ms`);
  process.exit(0);
};

run().catch((err) => {
  console.error('❌ messages conversion failed');
  console.error(err);
  process.exit(1);
});
