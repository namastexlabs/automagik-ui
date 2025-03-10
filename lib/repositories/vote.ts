import 'server-only';

import type { Vote } from '@/lib/db/schema';
import { voteMessage, getVotesByChatId } from '@/lib/db/queries/vote';
import { getChat } from './chat';

export async function updateMessageVote({
  chatId,
  messageId,
  type,
  userId,
}: {
  chatId: string;
  messageId: string;
  type: 'up' | 'down';
  userId: string;
}): Promise<void> {
  const chat = await getChat(chatId, userId);

  await voteMessage({ chatId: chat.id, messageId, type });
}

export async function getChatVotes(chatId: string, userId: string): Promise<Vote[]> {
  const chat = await getChat(chatId, userId);

  return await getVotesByChatId({ id: chat.id });
}
