import 'server-only';

import { convertToCoreMessages, type Message as AIMessage } from 'ai';

import { generateTitleFromUserMessage } from '@/lib/ai/generate-title';
import type { Chat, Message } from '@/lib/db/schema';
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

export type ChatWithLatestMessage = Chat & {
  latestMessage: Message;
};

export function verifyChatWritePermission(chat: Chat, userId: string) {
  if (chat.userId !== userId) {
    throw new UnauthorizedError('Not authorized to access this chat');
  }
}

export async function getChat(id: string, userId: string) {
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
): Promise<ChatWithLatestMessage[]> {
  const agent = await getAgent(agentId, userId);
  const chats = (await getChats({ userId, agentId: agent.id })).map(
    ({ message, chat }) => ({
      ...(chat as Chat),
      latestMessage: message as Message,
    }),
  );

  return chats;
}

export async function createChat({
  id,
  agentId,
  userId,
  messages,
}: {
  id?: string;
  agentId: string;
  userId: string;
  messages: AIMessage[];
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
  const userMessage = coreMessages.findLast(
    (message) => message.role === 'user',
  );

  if (!userMessage) {
    throw new InvalidDataError('No user message found');
  }

  return await saveChat({
    userId,
    agentId,
    title: await generateTitleFromUserMessage({ message: userMessage }),
    id,
  });
}

export async function getOrCreateChat(
  id: string,
  agentId: string,
  userId: string,
  messages: AIMessage[],
) {
  const chat = await getChatById({ id });

  if (chat) {
    return chat;
  }

  return await createChat({ id, agentId, userId, messages });
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
