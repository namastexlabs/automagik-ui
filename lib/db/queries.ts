import 'server-only';

import { genSaltSync, hashSync } from 'bcrypt-ts';
import { and, asc, eq, gt, gte, inArray } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import type { SzObject } from 'zodex';

import type { BlockKind } from '@/components/block';

import * as schema from './schema';

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
export const db = drizzle(client, { schema });

export async function getUser(email: string): Promise<Array<schema.User>> {
  try {
    return await db
      .select()
      .from(schema.user)
      .where(eq(schema.user.email, email));
  } catch (error) {
    console.error('Failed to get user from database');
    throw error;
  }
}

export async function createUser(email: string, password: string) {
  const salt = genSaltSync(10);
  const hash = hashSync(password, salt);

  try {
    return await db.insert(schema.user).values({ email, password: hash });
  } catch (error) {
    console.error('Failed to create user in database');
    throw error;
  }
}

export async function saveChat({
  id,
  userId,
  title,
  agentId,
}: {
  id: string;
  userId: string;
  title: string;
  agentId: string;
}) {
  try {
    const [createdChat] = await db
      .insert(schema.chat)
      .values({
      id,
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

export async function getChats({
  userId,
  agentId,
}: { userId: string; agentId?: string }) {
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

export async function getChatById({ id }: { id: string }) {
  try {
    return await db.query.chat.findFirst({
      where: (chat, { eq }) => eq(chat.id, id),
    });
  } catch (error) {
    console.error('Failed to get chat by id from database');
    throw error;
  }
}

export async function saveMessages({
  messages,
}: { messages: Array<schema.Message> }) {
  try {
    return await db.insert(schema.message).values(messages);
  } catch (error) {
    console.error('Failed to save messages in database', error);
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
    const [existingVote] = await db
      .select()
      .from(schema.vote)
      .where(and(eq(schema.vote.messageId, messageId)));

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
    return await db
      .select()
      .from(schema.vote)
      .where(eq(schema.vote.chatId, id));
  } catch (error) {
    console.error('Failed to get votes by chat id from database', error);
    throw error;
  }
}

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: BlockKind;
  content: string;
  userId: string;
}) {
  try {
    const [createdDocument] = await db
      .insert(schema.document)
      .values({
      id,
      title,
      kind,
      content,
      userId,
      createdAt: new Date(),
      })
      .returning();

    return createdDocument;
  } catch (error) {
    console.error('Failed to save document in database');
    throw error;
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    const documents = await db
      .select()
      .from(schema.document)
      .where(eq(schema.document.id, id))
      .orderBy(asc(schema.document.createdAt));

    return documents;
  } catch (error) {
    console.error('Failed to get document by id from database');
    throw error;
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const selectedDocument = await db.query.document.findFirst({
      where: (document, { eq }) => eq(document.id, id),
      orderBy: (document, { desc }) => [desc(document.createdAt)],
    });

    return selectedDocument;
  } catch (error) {
    console.error('Failed to get document by id from database');
    throw error;
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    await db
      .delete(schema.suggestion)
      .where(
        and(
          eq(schema.suggestion.documentId, id),
          gt(schema.suggestion.documentCreatedAt, timestamp),
        ),
      );

    return await db
      .delete(schema.document)
      .where(
        and(
          eq(schema.document.id, id),
          gt(schema.document.createdAt, timestamp),
        ),
      );
  } catch (error) {
    console.error(
      'Failed to delete documents by id after timestamp from database',
    );
    throw error;
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Array<schema.Suggestion>;
}) {
  try {
    return await db.insert(schema.suggestion).values(suggestions);
  } catch (error) {
    console.error('Failed to save suggestions in database');
    throw error;
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    return await db
      .select()
      .from(schema.suggestion)
      .where(and(eq(schema.suggestion.documentId, documentId)));
  } catch (error) {
    console.error(
      'Failed to get suggestions by document version from database',
    );
    throw error;
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(schema.message)
      .where(eq(schema.message.id, id));
  } catch (error) {
    console.error('Failed to get message by id from database');
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

export async function getAgentsByUserId({ userId }: { userId: string }) {
  try {
    return await db.query.agent.findMany({
      where: (agent, { eq }) => eq(agent.userId, userId),
      orderBy: (agent, { asc }) => [asc(agent.createdAt)],
    });
  } catch (error) {
    console.error('Failed to get agents in database');
    throw error;
  }
}

export async function getAgentById({ id }: { id: string }) {
  try {
    return await db.query.agent.findFirst({
      where: (agent, { eq }) => eq(agent.id, id),
      with: {
        tools: {
          columns: {},
          with: {
            agent: true,
            tool: true,
          },
        },
      },
    });
  } catch (error) {
    console.error('Failed to get agents in database');
    throw error;
  }
}

export async function createAgent({
  name,
  systemPrompt,
  userId,
}: {
  name: string;
  systemPrompt: string;
  userId: string;
}) {
  try {
    const [createdAgent] = await db
      .insert(schema.agent)
      .values({
        name,
        systemPrompt,
        userId,
      })
      .returning();

      return createdAgent;
  } catch (error) {
    console.error(`Failed to create agent ${name} in database`);
    throw error;
  }
}

export async function updateAgent({
  id,
  ...data
}: {
  id: string;
  name?: string;
  systemPrompt?: string;
}) {
  try {
    const [updatedAgent] = await db
      .update(schema.agent)
      .set(data)
      .where(eq(schema.agent.id, id))
      .returning();

    return updatedAgent;
  } catch (error) {
    console.error(`Failed to update agent ${id} in database`);
    throw error;
  }
}

export async function deleteAgentById({ id }: { id: string }) {
  try {
    return await db.delete(schema.agent).where(eq(schema.agent.id, id));
  } catch (error) {
    console.error(`Failed to delete agent ${id} in database`);
    throw error;
  }
}

export async function getInternalTools() {
  try {
    return await db.query.tool.findMany({
      where: (tool, { eq }) => eq(tool.source, 'internal'),
    });
  } catch (error) {
    console.error('Failed to get internal tools in database');
    throw error;
  }
}

export async function getAllToolsById(ids: string[]) {
  try {
    return await db.query.tool.findMany({
      where: (tool, { inArray }) => inArray(tool.id, ids),
    });
  } catch (error) {
    console.error('Failed to get tools in database');
    throw error;
  }
}

export async function createTool(data: {
  name: string;
  verboseName: string;
  description: string;
  parameters: SzObject;
  source: schema.Tool['source'];
}) {
  try {
    const [createdTool] = await db.insert(schema.tool).values(data).returning();

    return createdTool;
  } catch (error) {
    console.error(`Failed to create tool ${data.name} in database`);
    throw error;
  }
}

export async function updateTool({
  id,
  ...data
}: {
  id: string;
  name?: string;
  verboseName?: string;
  description?: string;
  parameters?: SzObject;
  source?: schema.Tool['source'];
  agentId?: string;
}) {
  try {
    const [updatedTool] = await db
      .update(schema.tool)
      .set(data)
      .where(eq(schema.tool.id, id))
      .returning();

    return updatedTool;
  } catch (error) {
    console.error(`Failed to update tool ${id} in database`);
    throw error;
  }
}

export async function deleteToolById({ id }: { id: string }) {
  try {
    return await db.delete(schema.tool).where(eq(schema.tool.id, id));
  } catch (error) {
    console.error(`Failed to delete tool ${id} in database`);
    throw error;
  }
}

