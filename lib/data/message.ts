/**
 * @fileoverview Top-level layer for the chat resource.
 * It is responsible for fetching and saving chats on API routes, server actions, and server components.
 * It also contains DTOs and schema for the chat form.
 * Use `lib/repositories`, to interact with the database and handle business logic.
 */

import 'server-only';
import type { Message } from 'ai';

import { getUser } from '@/lib/auth';
import {
  getChatVotes,
  updateMessageVote as updateMessageVoteRepository,
} from '@/lib/repositories/vote';
import {
  getChatMessages as getChatMessagesRepository,
  removeTrailingMessages,
} from '@/lib/repositories/message';
import { convertAttachmentUrls, convertToUIMessages } from '@/lib/utils.server';
import type { Vote } from '@/lib/db/schema';

import { type DataResponse, handleDataError } from './index.server';
import { DataStatus } from '.';

export async function getChatMessages(
  id: string,
): Promise<DataResponse<Message[]>> {
  const session = await getUser();
  try {
    const messages = await getChatMessagesRepository(id, session.user.id);
    return {
      status: DataStatus.Success,
      data: await Promise.all(
        convertToUIMessages(messages).map((message) =>
          convertAttachmentUrls(message, id),
        ),
      ),
    };
  } catch (error) {
    return handleDataError(error);
  }
}

export async function deleteTrailingMessages(
  id: string,
): Promise<DataResponse<null>> {
  const session = await getUser();
  try {
    await removeTrailingMessages(id, session.user.id);
    return { status: DataStatus.Success, data: null };
  } catch (error) {
    return handleDataError(error);
  }
}

export async function getMessageVotes(
  id: string,
): Promise<DataResponse<Vote[]>> {
  const session = await getUser();
  try {
    const votes = await getChatVotes(id, session.user.id);
    return { status: DataStatus.Success, data: votes };
  } catch (error) {
    return handleDataError(error);
  }
}

export async function updateMessageVote(
  id: string,
  messageId: string,
  type: 'up' | 'down',
): Promise<DataResponse<null>> {
  const session = await getUser();
  try {
    await updateMessageVoteRepository({
      chatId: id,
      messageId,
      type,
      userId: session.user.id,
    });
    return { status: DataStatus.Success, data: null };
  } catch (error) {
    return handleDataError(error);
  }
}
