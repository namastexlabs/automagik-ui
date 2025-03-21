import 'server-only';

import { convertToCoreMessages, type Message } from 'ai';

import { generateTitleFromUserMessage } from '@/lib/ai/generate-title';
import { getMostRecentUserMessage } from '@/lib/utils.server';
import { generateUUID } from '@/lib/utils';
import type { Chat } from '@/lib/db/schema';
import {
  saveChat,
  getChatById,
  deleteChatById,
  updateChatVisiblityById,
  getChats,
} from '@/lib/db/queries/chat';
import {
  InvalidDataError,
  NotFoundError,
  UnauthorizedError,
} from '@/lib/errors';
import { getAgent } from './agent';

export function verifyChatWritePermission(chat: Chat, userId: string) {
  if (chat.userId !== userId) {
    throw new UnauthorizedError('Not authorized to access this chat');
  }
}

export async function getChat(id: string, userId: string): Promise<Chat> {
  const chat = await getChatById({ id });
  if (!chat) {
    throw new NotFoundError('Chat not found');
  }

  if (chat.userId !== userId && chat.visibility === 'private') {
    throw new UnauthorizedError('Not authorized to access this chat');
  }

  return chat;
}

export async function getAgentChats(
  userId: string,
  agentId: string,
): Promise<Chat[]> {
  const agent = await getAgent(agentId, userId);
  const chats = await getChats({ userId, agentId: agent.id });

  return chats;
}

export async function createChat({
  agentId,
  userId,
  messages,
}: {
  agentId: string;
  userId: string;
  messages: Message[];
}): Promise<Chat> {
  const agent = await getAgent(agentId, userId);

  const hasPermission =
    agent && (agent.visibility === 'public' || agent.userId === userId);

  if (!hasPermission) {
    throw new UnauthorizedError(
      'Not authorized to create a chat for this agent',
    );
  }

  const coreMessages = convertToCoreMessages(messages);
  const userMessage = getMostRecentUserMessage(coreMessages);

  if (!userMessage) {
    throw new InvalidDataError('No user message found');
  }

  return await saveChat({
    id: generateUUID(),
    userId,
    agentId,
    title: await generateTitleFromUserMessage({ message: userMessage }),
  });
}

export async function removeChatById(
  chatId: string,
  userId: string,
): Promise<void> {
  const chat = await getChatById({ id: chatId });
  if (!chat) {
    throw new NotFoundError('Chat not found');
  }
  if (chat.userId !== userId) {
    throw new UnauthorizedError('Not authorized to delete this chat');
  }

  await deleteChatById({ id: chatId });
}

export async function updateVisibility({
  chatId,
  userId,
  visibility,
}: {
  chatId: string;
  userId: string;
  visibility: 'private' | 'public';
}): Promise<void> {
  const chat = await getChatById({ id: chatId });
  if (!chat) {
    throw new NotFoundError('Chat not found');
  }
  if (chat.userId !== userId) {
    throw new UnauthorizedError('Not authorized to update this chat');
  }

  await updateChatVisiblityById({ chatId, visibility });
}
