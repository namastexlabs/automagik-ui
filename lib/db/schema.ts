import { relations, type InferSelectModel } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  timestamp,
  json,
  uuid,
  text,
  primaryKey,
  foreignKey,
  boolean,
  unique,
} from 'drizzle-orm/pg-core';
import type { SzObject } from 'zodex';

export const user = pgTable('User', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  email: varchar('email', { length: 64 }).notNull(),
  password: varchar('password', { length: 64 }),
});

export type User = InferSelectModel<typeof user>;

export const dynamicBlock = pgTable(
  'DynamicBlock',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    name: text('name').notNull(),
    content: text('content').notNull().default('BLANK'),
    agentId: uuid('agentId')
      .notNull()
      .references(() => agent.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    uniqueName: unique().on(table.name, table.agentId),
  }),
);

export type DynamicBlock = InferSelectModel<typeof dynamicBlock>;

export const tool = pgTable(
  'Tool',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    name: text('name').notNull(),
    verboseName: text('verboseName').notNull(),
    description: text('description').notNull(),
    parameters: json('parameters').$type<SzObject>().notNull(),
    source: text('source', { enum: ['internal'] }).notNull(),
  },
  (table) => ({
    uniqueUserName: unique().on(table.name, table.source),
  }),
);

export type Tool = InferSelectModel<typeof tool>;

export const agent = pgTable(
  'Agent',
  {
    id: uuid().primaryKey().notNull().defaultRandom(),
    name: text().notNull(),
    systemPrompt: text().notNull(),
    createdAt: timestamp().notNull().defaultNow(),
    userId: uuid()
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    uniqueUserName: unique().on(table.name, table.userId),
  }),
);

export type Agent = InferSelectModel<typeof agent>;

export const agentsToTools = pgTable(
  'AgentToTool',
  {
    agentId: uuid('agentId')
      .notNull()
      .references(() => agent.id, { onDelete: 'cascade' }),
    toolId: uuid('toolId')
      .notNull()
      .references(() => tool.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.agentId, table.toolId] }),
  }),
);

export type AgentsToTools = InferSelectModel<typeof agentsToTools>;

export const agentRelations = relations(agent, ({ many }) => ({
  tools: many(agentsToTools),
  dynamicBlocks: many(dynamicBlock),
}));

export const dynamicBlockRelations = relations(dynamicBlock, ({ one }) => ({
  agent: one(agent, {
    fields: [dynamicBlock.agentId],
    references: [agent.id],
  }),
}));

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

export const chat = pgTable('Chat', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  createdAt: timestamp('createdAt').notNull(),
  title: text('title').notNull(),
  agentId: uuid('agentId')
    .notNull()
    .references(() => agent.id, { onDelete: 'cascade' }),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  visibility: varchar('visibility', { enum: ['public', 'private'] })
    .notNull()
    .default('private'),
});

export type Chat = InferSelectModel<typeof chat>;

export const message = pgTable('Message', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  chatId: uuid('chatId')
    .notNull()
    .references(() => chat.id, { onDelete: 'cascade' }),
  role: varchar('role').notNull(),
  content: json('content').notNull(),
  createdAt: timestamp('createdAt').notNull(),
});

export type Message = InferSelectModel<typeof message>;

export const vote = pgTable(
  'Vote',
  {
    chatId: uuid('chatId')
      .notNull()
      .references(() => chat.id, { onDelete: 'cascade' }),
    messageId: uuid('messageId')
      .notNull()
      .references(() => message.id, { onDelete: 'cascade' }),
    isUpvoted: boolean('isUpvoted').notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.chatId, table.messageId] }),
  }),
);

export type Vote = InferSelectModel<typeof vote>;

export const document = pgTable(
  'Document',
  {
    id: uuid('id').notNull().defaultRandom(),
    createdAt: timestamp('createdAt').notNull(),
    title: text('title').notNull(),
    content: text('content'),
    kind: varchar('text', { enum: ['text', 'code'] })
      .notNull()
      .default('text'),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id, table.createdAt] }),
  }),
);

export type Document = InferSelectModel<typeof document>;

export const suggestion = pgTable(
  'Suggestion',
  {
    id: uuid('id').notNull().defaultRandom(),
    documentId: uuid('documentId').notNull(),
    documentCreatedAt: timestamp('documentCreatedAt').notNull(),
    originalText: text('originalText').notNull(),
    suggestedText: text('suggestedText').notNull(),
    description: text('description'),
    isResolved: boolean('isResolved').notNull().default(false),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('createdAt').notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    documentRef: foreignKey({
      columns: [table.documentId, table.documentCreatedAt],
      foreignColumns: [document.id, document.createdAt],
    }),
  }),
);

export type Suggestion = InferSelectModel<typeof suggestion>;
