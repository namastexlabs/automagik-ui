import 'server-only';
import { eq } from 'drizzle-orm';

import { db, schema } from './index';

export async function saveChat({
  userId,
  title,
  agentId,
}: {
  userId: string;
  title: string;
  agentId: string;
}) {
  try {
    const [createdChat] = await db
      .insert(schema.chat)
      .values({
        createdAt: new Date(),
        userId,
        title,
        agentId,
      })
      .returning();

    return createdChat;
  } catch (error) {
    console.error('Failed to save chat in database');
    throw error;
  }
}

export async function getChats({
  userId,
  agentId,
}: {
  userId: string;
  agentId?: string;
}) {
  try {
    return await db.query.chat.findMany({
      where: (chat, { and, eq }) =>
        and(
          eq(chat.userId, userId),
          agentId ? eq(chat.agentId, agentId) : undefined,
        ),
      orderBy: (chat, { desc }) => [desc(chat.createdAt)],
    });
  } catch (error) {
    console.error('Failed to get chats by user from database');
    throw error;
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    await db.delete(schema.vote).where(eq(schema.vote.chatId, id));
    await db.delete(schema.message).where(eq(schema.message.chatId, id));

    return await db.delete(schema.chat).where(eq(schema.chat.id, id));
  } catch (error) {
    console.error('Failed to delete chat by id from database');
    throw error;
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    return await db.query.chat.findFirst({
      where: (chat, { eq }) => eq(chat.id, id),
      with: {
        agent: true,
      },
    });
  } catch (error) {
    console.error('Failed to get chat by id from database');
    throw error;
  }
}

export async function updateChatVisiblityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: 'private' | 'public';
}) {
  try {
    return await db
      .update(schema.chat)
      .set({ visibility })
      .where(eq(schema.chat.id, chatId));
  } catch (error) {
    console.error('Failed to update chat visibility in database');
    throw error;
  }
}
