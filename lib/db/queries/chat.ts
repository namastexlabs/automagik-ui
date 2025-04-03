import 'server-only';
import { and, desc, eq, getTableColumns } from 'drizzle-orm';

import { db, schema } from './index';
import { aliasedColumn } from '@/lib/utils.server';

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
  limit = 10,
}: {
  userId: string;
  agentId: string;
  limit?: number;
}) {
  try {
    const prefixedChatColumns = Object.fromEntries(
      Object.entries(getTableColumns(schema.chat)).map(([key, value]) => [
        key,
        aliasedColumn(value, `chat_${value.name}`),
      ]),
    );
    const prefixedMessageColumns = Object.fromEntries(
      Object.entries(getTableColumns(schema.message)).map(([key, value]) => [
        key,
        aliasedColumn(value, `message_${value.name}`),
      ]),
    );

    const innerQuery = db
      .selectDistinctOn([schema.chat.id], {
        chat: prefixedChatColumns,
        message: prefixedMessageColumns,
      })
      .from(schema.chat)
      .where(
        and(eq(schema.chat.userId, userId), eq(schema.chat.agentId, agentId)),
      )
      .innerJoin(schema.message, eq(schema.chat.id, schema.message.chatId))
      .orderBy(schema.chat.id, desc(schema.message.createdAt))
      .limit(limit)
      .as('inner_query');

    return await db
      .select()
      .from(innerQuery)
      .orderBy(desc(innerQuery.message.createdAt));
  } catch (error) {
    console.log(error);
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
