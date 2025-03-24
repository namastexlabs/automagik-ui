/**
 * @fileoverview Top-level layer for the chat resource.
 * It is responsible for fetching and saving chats on API routes, server actions, and server components.
 * It also contains DTOs and schema for the chat form.
 * Use `lib/repositories`, to interact with the database and handle business logic.
 */

import 'server-only';
import type { Message } from 'ai';

import { getUser } from '@/lib/auth';
import type { VisibilityType } from '@/components/visibility-selector';
import {
  updateVisibility,
  createChat as createChatRepository,
  removeChatById,
  getAgentChats,
  getChat as getChatRepository,
} from '@/lib/repositories/chat';
import type { Chat, Agent } from '@/lib/db/schema';

import { type DataResponse, handleDataError } from './index.server';
import { DataStatus } from '.';

export type ChatDTO = Chat & {
  agent: {
    name: string;
    avatarUrl: string | null;
  };
};

const toChatDTO = (chat: Chat & { agent: Agent }): ChatDTO => {
  return {
    ...chat,
    agent: {
      name: chat.agent.name,
      avatarUrl: chat.agent.avatarUrl,
    },
  };
};

export async function getChat(id: string): Promise<DataResponse<ChatDTO>> {
  const session = await getUser();
  try {
    const chat = await getChatRepository(id, session.user.id);
    return { status: DataStatus.Success, data: toChatDTO(chat) };
  } catch (error) {
    return handleDataError(error);
  }
}

export async function getChats(agentId: string): Promise<DataResponse<Chat[]>> {
  const session = await getUser();
  try {
    const chats = await getAgentChats(session.user.id, agentId);
    return { status: DataStatus.Success, data: chats };
  } catch (error) {
    return handleDataError(error, []);
  }
}

export async function updateChatVisibility(
  chatId: string,
  visibility: VisibilityType,
): Promise<DataResponse<null>> {
  const session = await getUser();
  try {
    await updateVisibility({ chatId, userId: session.user.id, visibility });
    return { status: DataStatus.Success, data: null };
  } catch (error) {
    return handleDataError(error);
  }
}

export async function createChat(
  agentId: string,
  messages: Message[],
): Promise<DataResponse<Chat | null, Chat>> {
  const session = await getUser();
  try {
    const chat = await createChatRepository({
      agentId,
      userId: session.user.id,
      messages,
    });

    return { status: DataStatus.Success, data: chat };
  } catch (error) {
    return handleDataError(error);
  }
}

export async function deleteChat(
  id: string,
): Promise<DataResponse<null, Chat>> {
  const session = await getUser();
  try {
    await removeChatById(id, session.user.id);
    return { status: DataStatus.Success, data: null };
  } catch (error) {
    return handleDataError(error);
  }
}
