import 'server-only';
import { and, eq } from 'drizzle-orm';

import * as schema from '../schema';
import { db } from './index';

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: 'up' | 'down';
}) {
  try {
    const existingVote = await db.query.vote.findFirst({
      where: and(eq(schema.vote.messageId, messageId)),
    });

    if (existingVote) {
      return await db
        .update(schema.vote)
        .set({ isUpvoted: type === 'up' })
        .where(
          and(
            eq(schema.vote.messageId, messageId),
            eq(schema.vote.chatId, chatId),
          ),
        );
    }
    return await db.insert(schema.vote).values({
      chatId,
      messageId,
      isUpvoted: type === 'up',
    });
  } catch (error) {
    console.error('Failed to upvote message in database', error);
    throw error;
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await db.query.vote.findMany({
      where: (vote, { eq }) => eq(vote.chatId, id),
    });
  } catch (error) {
    console.error('Failed to get votes by chat id from database', error);
    throw error;
  }
}
