import 'server-only';

import { eq, asc, and, gte } from 'drizzle-orm';
import type { Message } from 'ai';

import { db, schema } from './index';

export async function saveMessages({
  messages,
}: {
  messages: Array<schema.Message>;
}) {
  try {
    return await db.insert(schema.message).values(messages);
  } catch (error) {
    console.error('Failed to save messages in database', error);
    throw error;
  }
}

export async function updateMessage(
  id: string,
  content: Omit<Message, 'id' | 'role' | 'createdAt'>,
) {
  try {
    return await db
      .update(schema.message)
      .set({ content })
      .where(eq(schema.message.id, id));
  } catch (error) {
    console.error('Failed to update message in database', error);
    throw error;
  }
}

export async function getMessages() {
  try {
    return await db.query.message.findMany({
      orderBy: (message, { desc }) => [desc(message.createdAt)],
    });
  } catch (error) {
    console.error('Failed to get all messages from database', error);
    throw error;
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(schema.message)
      .where(eq(schema.message.chatId, id))
      .orderBy(asc(schema.message.createdAt));
  } catch (error) {
    console.error('Failed to get messages by chat id from database', error);
    throw error;
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    return await db.query.message.findFirst({
      where: (message, { eq }) => eq(message.id, id),
      with: {
        chat: true,
      },
    });
  } catch (error) {
    console.error('Failed to get message by id from database');
    throw error;
  }
}

export async function deleteMessage({ id }: { id: string }) {
  try {
    return await db.delete(schema.message).where(eq(schema.message.id, id));
  } catch (error) {
    console.error('Failed to delete message by id from database');
    throw error;
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    return await db
      .delete(schema.message)
      .where(
        and(
          eq(schema.message.chatId, chatId),
          gte(schema.message.createdAt, timestamp),
        ),
      );
  } catch (error) {
    console.error(
      'Failed to delete messages by id after timestamp from database',
    );
    throw error;
  }
}
