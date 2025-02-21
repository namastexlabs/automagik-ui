import type { CoreUserMessage, Message } from 'ai';
import 'server-only';

import {
  copyMessageFile,
  deleteMessageFile,
  getMessageFile,
  isKeyWithChatId,
  isSignedUrlExpired,
} from './services/minio';

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

export async function moveAttachmentToChat(name: string, chatId: string) {
  await copyMessageFile(name, name, undefined, chatId);
  await deleteMessageFile(name);

  return getMessageFile(name, chatId);
}

export async function convertCoreMessageAttachments(
  userMessage: CoreUserMessage,
  chatId: string,
) {
  return Array.isArray(userMessage.content)
    ? {
        ...userMessage,
        content: await Promise.all(
          userMessage.content.map(async (content) => {
            if (content.type === 'image' && content.image instanceof URL) {
              // biome-ignore lint/style/noNonNullAssertion: <explanation>
              const name = content.image.pathname.split('/').pop()!;
              return {
                ...content,
                // biome-ignore lint/style/noNonNullAssertion: <explanation>
                mimeType: `image/${name.split('.').pop()!}`,
                image: isKeyWithChatId(content.image.pathname)
                  ? content.image
                  : new URL(await moveAttachmentToChat(name, chatId)),
              };
            }

            return content;
          }),
        ),
      }
    : userMessage
}
