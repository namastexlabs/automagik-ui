import type { SzObject } from 'zodex';
import { relations, sql, type InferSelectModel } from 'drizzle-orm';
import type { Message as AIMessage } from 'ai';
import {
  varchar,
  timestamp,
  json,
  uuid,
  text,
  primaryKey,
  foreignKey,
  boolean,
  unique,
  uniqueIndex,
  pgTableCreator,
} from 'drizzle-orm/pg-core';
import type { ToolData } from '../agents/types';

export type MessageContent = Omit<AIMessage, 'id' | 'role' | 'createdAt'>;

const pgTable = pgTableCreator((name) => `automagikui_${name}`);

export const user = pgTable('user', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  email: varchar('email', { length: 64 }).notNull(),
  password: varchar('password', { length: 64 }),
});

export type User = InferSelectModel<typeof user>;

export const dynamicBlock = pgTable(
  'dynamic_block',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    name: text('name').notNull(),
    content: text('content'),
    visibility: varchar('visibility', { enum: ['public', 'private'] })
      .notNull()
      .default('private'),
    userId: uuid('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (table) => [
    uniqueIndex('dynamic_block_unique_private_user')
      .on(table.userId, table.name)
      .where(sql`${table.visibility} = 'private'`),
    uniqueIndex('dynamic_block_unique_public_user')
      .on(table.name)
      .where(sql`${table.visibility} = 'public'`),
  ],
);

export type DynamicBlock = InferSelectModel<typeof dynamicBlock>;

export const tool = pgTable(
  'tool',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    userId: uuid('user_id').references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    verboseName: text('verbose_name').notNull(),
    description: text('description').notNull(),
    visibility: varchar('visibility', { enum: ['public', 'private'] })
      .notNull()
      .default('public'),
    parameters: json('parameters').$type<SzObject>(),
    source: text('source', { enum: ['internal', 'automagik'] }).notNull(),
    data: json('data').$type<ToolData>().notNull().default({}),
  },
  (table) => [
    unique('tool_unique_user_name').on(table.name, table.source),
    uniqueIndex('tool_unique_private_user')
      .on(table.userId, table.name)
      .where(sql`${table.visibility} = 'private'`),
    uniqueIndex('tool_unique_public_user')
      .on(table.name)
      .where(sql`${table.visibility} = 'public'`),
  ],
);

export type Tool = InferSelectModel<typeof tool>;

export const agent = pgTable(
  'agent',
  {
    id: uuid().primaryKey().notNull().defaultRandom(),
    name: text().notNull(),
    systemPrompt: text('system_prompt').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    visibility: varchar('visibility', { enum: ['public', 'private'] })
      .notNull()
      .default('private'),
    userId: uuid('user_id').references(() => user.id, { onDelete: 'cascade' }),
  },
  (table) => [
    unique('agent_unique_user_name').on(table.name, table.userId),
    uniqueIndex('agent_unique_private_user')
      .on(table.userId, table.name)
      .where(sql`${table.visibility} = 'private'`),
    uniqueIndex('agent_unique_public_user')
      .on(table.name)
      .where(sql`${table.visibility} = 'public'`),
  ],
);

export type Agent = InferSelectModel<typeof agent>;

export const agentsToTools = pgTable(
  'agent_to_tool',
  {
    agentId: uuid('agent_id')
      .notNull()
      .references(() => agent.id, { onDelete: 'cascade' }),
    toolId: uuid('tool_id')
      .notNull()
      .references(() => tool.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({
      columns: [table.agentId, table.toolId],
      name: 'pk__agent_to_tool',
    }),
  ],
);

export type AgentsToTools = InferSelectModel<typeof agentsToTools>;

export const agentsToDynamicBlocks = pgTable(
  'agent_to_dynamic_block',
  {
    agentId: uuid('agent_id')
      .notNull()
      .references(() => agent.id, { onDelete: 'cascade' }),
    dynamicBlockId: uuid('dynamic_block_id')
      .notNull()
      .references(() => dynamicBlock.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({
      columns: [table.agentId, table.dynamicBlockId],
      name: 'pk__agent_to_dynamic_block',
    }),
  ],
);

export type AgentsToDynamicBlocks = InferSelectModel<
  typeof agentsToDynamicBlocks
>;

export const agentRelations = relations(agent, ({ many }) => ({
  tools: many(agentsToTools),
  dynamicBlocks: many(agentsToDynamicBlocks),
}));

export const agentToDynamicBlockRelations = relations(
  agentsToDynamicBlocks,
  ({ one }) => ({
    dynamicBlock: one(dynamicBlock, {
      fields: [agentsToDynamicBlocks.dynamicBlockId],
      references: [dynamicBlock.id],
    }),
    agent: one(agent, {
      fields: [agentsToDynamicBlocks.agentId],
      references: [agent.id],
    }),
  }),
);

export const agentToToolsRelations = relations(agentsToTools, ({ one }) => ({
  tool: one(tool, {
    fields: [agentsToTools.toolId],
    references: [tool.id],
  }),
  agent: one(agent, {
    fields: [agentsToTools.agentId],
    references: [agent.id],
  }),
}));

export const chat = pgTable('chat', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  createdAt: timestamp('created_at').notNull(),
  title: text('title').notNull(),
  agentId: uuid('agent_id')
    .notNull()
    .references(() => agent.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  visibility: varchar('visibility', { enum: ['public', 'private'] })
    .notNull()
    .default('private'),
});

export type Chat = InferSelectModel<typeof chat>;

export const message = pgTable('message', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  chatId: uuid('chat_id')
    .notNull()
    .references(() => chat.id, { onDelete: 'cascade' }),
  role: varchar('role', {
    enum: ['system', 'user', 'assistant', 'data'],
  }).notNull(),
  content: json('content').$type<MessageContent>().notNull(),
  createdAt: timestamp('created_at').notNull(),
});

export type Message = InferSelectModel<typeof message>;

export const messageRelations = relations(message, ({ one }) => ({
  chat: one(chat, {
    fields: [message.chatId],
    references: [chat.id],
  }),
}));

export const vote = pgTable(
  'vote',
  {
    chatId: uuid('chat_id')
      .notNull()
      .references(() => chat.id, { onDelete: 'cascade' }),
    messageId: uuid('message_id')
      .notNull()
      .references(() => message.id, { onDelete: 'cascade' }),
    isUpvoted: boolean('is_upvoted').notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.chatId, table.messageId],
      name: 'pk__vote',
    }),
  ],
);

export type Vote = InferSelectModel<typeof vote>;

export const document = pgTable(
  'document',
  {
    id: uuid('id').notNull().defaultRandom(),
    createdAt: timestamp('created_at').notNull(),
    title: text('title').notNull(),
    content: text('content'),
    kind: varchar('text', { enum: ['text', 'code', 'image', 'sheet'] })
      .notNull()
      .default('text'),
    userId: uuid('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({
      columns: [table.id, table.createdAt],
      name: 'pk__document',
    }),
  ],
);

export type Document = InferSelectModel<typeof document>;

export const suggestion = pgTable(
  'suggestion',
  {
    id: uuid('id').notNull().defaultRandom(),
    documentId: uuid('document_id').notNull(),
    documentCreatedAt: timestamp('document_created_at').notNull(),
    originalText: text('original_text').notNull(),
    suggestedText: text('suggested_text').notNull(),
    description: text('description'),
    isResolved: boolean('is_resolved').notNull().default(false),
    userId: uuid('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.id], name: 'pk__suggestion' }),
    foreignKey({
      columns: [table.documentId, table.documentCreatedAt],
      foreignColumns: [document.id, document.createdAt],
      name: 'fk__suggestion__document',
    }),
  ],
);

export type Suggestion = InferSelectModel<typeof suggestion>;
