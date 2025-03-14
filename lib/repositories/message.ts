import 'server-only';

import type { Message as AIMessage } from 'ai';
import type { Chat, Message } from '@/lib/db/schema';
import {
  saveMessages,
  updateMessage,
  getMessages,
  getMessagesByChatId,
  getMessageById,
  deleteMessage,
  deleteMessagesByChatIdAfterTimestamp,
} from '@/lib/db/queries/message';
import { NotFoundError, UnauthorizedError } from '@/lib/errors';
import { getChat } from './chat';

export async function createMessages(messages: Message[]): Promise<void> {
  await saveMessages({ messages });
}

export async function updateMessageContent(
  id: string,
  chat: Chat,
  userId: string,
  content: Omit<AIMessage, 'id' | 'role' | 'createdAt'>,
): Promise<void> {
  if (chat.userId !== userId) {
    throw new UnauthorizedError('Not authorized to update this message');
  }

  await updateMessage(id, content);
}

export async function getAllMessages(): Promise<Message[]> {
  return await getMessages();
}

export async function getChatMessages(
  chatId: string,
  userId: string,
): Promise<Message[]> {
  const chat = await getChat(chatId, userId);

  const messages = await getMessagesByChatId({ id: chat.id });
  return messages;
}

export async function removeMessage(id: string, userId: string): Promise<void> {
  const message = await getMessageById({ id });
  if (!message) {
    throw new NotFoundError('Message not found');
  }
  if (message.chat.userId !== userId) {
    throw new UnauthorizedError('Not authorized to access this message');
  }
  await deleteMessage({ id });
}

export async function removeTrailingMessages(
  messageId: string,
  userId: string,
): Promise<void> {
  const message = await getMessageById({ id: messageId });
  if (!message) {
    throw new NotFoundError('Message not found');
  }

  if (message.chat.userId !== userId) {
    throw new UnauthorizedError('Not authorized to delete these messages');
  }

  await deleteMessagesByChatIdAfterTimestamp({
    chatId: message.chatId,
    timestamp: message.createdAt,
  });
}
