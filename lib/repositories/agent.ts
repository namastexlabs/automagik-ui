import 'server-only';

import type { Agent, Message, Chat } from '@/lib/db/schema';
import {
  getDefaultAgents,
  getAvailableAgents,
  getAgentById,
  getAgentByNameAndUserId,
  deleteAgentById,
  createAgentTransaction,
  updateAgentTransaction,
  type AgentData,
  getLatestAgentMessages,
} from '@/lib/db/queries/agent';
import { getDiffRelation } from '@/lib/utils.server';
import { ConflictError, NotFoundError, UnauthorizedError } from '@/lib/errors';
import { isUniqueConstraintError } from '../db/queries';
import { getToolsByIds } from './tool';
import { getOrCreateDynamicBlocks } from './dynamic-block';

export type AgentWithMessages = Agent & {
  recentMessage: Message;
  chat: Chat;
};

export async function getSystemAgents(): Promise<AgentData[]> {
  return await getDefaultAgents();
}

export async function getMostRecentAgents(
  userId: string,
): Promise<AgentWithMessages[]> {
  const data = await getLatestAgentMessages(userId, 10);

  const agents = data.map(({ chat, agent, message }) => ({
    ...agent,
    recentMessage: message,
    chat,
  }));

  return agents;
}

export async function getUserAgents(userId: string): Promise<AgentData[]> {
  return await getAvailableAgents({ userId });
}

export async function getAgent(id: string, userId: string): Promise<AgentData> {
  const agent = await getAgentById({ id });
  if (!agent) {
    throw new NotFoundError('Agent not found');
  }

  const isOwner = userId === agent.userId;
  if (!isOwner && agent.visibility === 'private') {
    throw new UnauthorizedError('Not authorized to access this agent');
  }

  return agent;
}

export async function findAgentByName(
  name: string,
  userId: string,
  visibility: 'private' | 'public',
): Promise<Agent | undefined> {
  return await getAgentByNameAndUserId({ name, userId, visibility });
}

export async function createAgent({
  name,
  systemPrompt,
  userId,
  visibility = 'private',
  tools = [],
  dynamicBlocks = [],
}: {
  name: string;
  systemPrompt: string;
  userId: string;
  visibility?: 'private' | 'public';
  tools?: string[];
  dynamicBlocks?: { name: string; visibility: 'private' | 'public' }[];
}): Promise<AgentData> {
  const agentTools = await getToolsByIds(tools, userId);
  const agentDynamicBlocks = await getOrCreateDynamicBlocks(
    userId,
    dynamicBlocks,
  );

  try {
    const agent = await createAgentTransaction({
      name,
      systemPrompt,
      userId,
      visibility,
      tools: agentTools.map((tool) => tool.id),
      dynamicBlocks: agentDynamicBlocks.map((block) => block.id),
    });

    return {
      ...agent,
      tools: agentTools.map((tool) => ({ tool })),
      dynamicBlocks: agentDynamicBlocks.map((block) => ({
        dynamicBlock: block,
      })),
    };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      const message = `An ${visibility} agent with this name already exists`;
      throw new ConflictError(message, { name: [message] });
    }
    throw error;
  }
}

export async function updateAgent({
  tools,
  dynamicBlocks,
  ...data
}: {
  id: string;
  userId: string;
  name: string;
  systemPrompt: string;
  visibility: 'private' | 'public';
  tools?: string[];
  dynamicBlocks?: { name: string; visibility: 'private' | 'public' }[];
}): Promise<AgentData> {
  const agent = await getAgentById({ id: data.id });
  if (!agent) {
    throw new NotFoundError('Agent not found');
  }
  if (agent.userId !== data.userId) {
    throw new UnauthorizedError('Not authorized to update this agent');
  }

  const formTools =
    tools && tools.length > 0 ? await getToolsByIds(tools, data.userId) : [];
  const formDynamicBlocks =
    dynamicBlocks && dynamicBlocks.length > 0
      ? await getOrCreateDynamicBlocks(data.userId, dynamicBlocks)
      : [];

  const [removedTools, newTools] = formTools
    ? getDiffRelation(
        agent.tools.map(({ tool }) => tool),
        formTools.map((tool) => tool.id),
        (a, b) => a.id === b,
      )
    : [];
  const [removedDynamicBlocks, newDynamicBlocks] = formDynamicBlocks
    ? getDiffRelation(
        agent.dynamicBlocks.map(({ dynamicBlock }) => dynamicBlock),
        formDynamicBlocks.map((block) => block.id),
        (a, b) => a.id === b,
      )
    : [];

  try {
    await updateAgentTransaction({
      ...data,
      newTools: newTools?.map((tool) => tool),
      newDynamicBlocks: newDynamicBlocks?.map((block) => block),
      removedTools: removedTools?.map((tool) => tool.id),
      removedDynamicBlocks: removedDynamicBlocks?.map((block) => block.id),
    });

    return {
      ...data,
      createdAt: agent.createdAt,
      tools: tools ? formTools.map((tool) => ({ tool })) : [],
      dynamicBlocks: dynamicBlocks
        ? formDynamicBlocks.map((block) => ({ dynamicBlock: block }))
        : [],
    };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      const message = `An ${data.visibility} agent with this name already exists`;
      throw new ConflictError(message, { name: [message] });
    }
    throw error;
  }
}

export async function duplicateAgent(
  id: string,
  userId: string,
): Promise<AgentData> {
  const agent = await getAgent(id, userId);

  const isOwner = userId === agent.userId;
  if (!isOwner && agent.visibility === 'private') {
    throw new UnauthorizedError('Not authorized to duplicate this agent');
  }

  try {
    const newAgent = await createAgentTransaction({
      name: agent.name,
      systemPrompt: agent.systemPrompt,
      userId,
      visibility: 'private',
      tools: agent.tools.map(({ tool }) => tool.id),
      dynamicBlocks: agent.dynamicBlocks.map(
        ({ dynamicBlock }) => dynamicBlock.id,
      ),
    });

    return {
      ...newAgent,
      tools: agent.tools.map(({ tool }) => ({ tool })),
      dynamicBlocks: agent.dynamicBlocks.map(({ dynamicBlock }) => ({
        dynamicBlock,
      })),
    };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new ConflictError('Agent is already duplicated');
    }
    throw error;
  }
}

export async function removeAgent(id: string, userId: string): Promise<void> {
  const agent = await getAgentById({ id });
  if (!agent) {
    throw new NotFoundError('Agent not found');
  }
  if (agent.userId !== userId) {
    throw new UnauthorizedError('Not authorized to update this agent');
  }

  await deleteAgentById({ id });
}
