import 'server-only';

import type { Agent, Message, Chat } from '@/lib/db/schema';
import {
  getDefaultAgents,
  getAvailableAgents,
  getAgentById,
  deleteAgentById,
  createAgentTransaction,
  updateAgentTransaction,
  type AgentData,
  getLatestAgentMessages,
} from '@/lib/db/queries/agent';
import { getDiffRelation } from '@/lib/utils.server';
import { ConflictError, NotFoundError, UnauthorizedError } from '@/lib/errors';
import {
  getAgentKey,
  saveAgentAvatar,
  deleteAgentAvatar,
  getFilenameFromKey,
  getUrlFromKey,
} from '@/lib/services/minio';

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
  const agents = data.map(({ agent, chat, message }) => ({
    ...(agent as Agent),
    chat: chat as Chat,
    recentMessage: message as Message,
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

export async function createAgent(
  {
    name,
    systemPrompt,
    userId,
    description,
    visibility = 'private',
    heartbeat = false,
    tools = [],
    dynamicBlocks = [],
    avatarFile,
  }: {
    name: string;
    systemPrompt: string;
    userId: string;
    description: string;
    visibility?: 'private' | 'public';
    heartbeat?: boolean;
    tools?: string[];
    dynamicBlocks?: Array<{ name: string; visibility: 'private' | 'public' }>;
    avatarFile?: Blob | null;
  },
  authenticatedUserId: string,
): Promise<AgentData> {
  const agentTools = await getToolsByIds(tools, authenticatedUserId);
  const agentDynamicBlocks = await getOrCreateDynamicBlocks(
    authenticatedUserId,
    dynamicBlocks,
  );

  try {
    const agent = await createAgentTransaction({
      name,
      systemPrompt,
      userId,
      visibility,
      description,
      heartbeat,
      tools: agentTools.map((tool) => tool.id),
      dynamicBlocks: agentDynamicBlocks.map((block) => block.id),
    });

    if (avatarFile) {
      const filename = (avatarFile as File).name;
      await saveAgentAvatar(
        agent.id,
        filename,
        Buffer.from(await avatarFile.arrayBuffer()),
      );

      const avatarUrl = getAgentKey(agent.id, filename);
      await updateAgentTransaction({
        id: agent.id,
        avatarUrl,
      });
    }

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

export async function updateAgent(
  {
    visibility,
    tools,
    dynamicBlocks,
    avatarFile,
    ...data
  }: {
    id: string;
    name?: string;
    systemPrompt?: string;
    visibility?: 'private' | 'public';
    description?: string;
    heartbeat?: boolean;
    tools?: string[];
    dynamicBlocks?: Array<{ name: string; visibility: 'private' | 'public' }>;
    avatarFile?: Blob | null;
  },
  authenticatedUserId: string,
): Promise<AgentData> {
  const agent = await getAgentById({ id: data.id });
  if (!agent) {
    throw new NotFoundError('Agent not found');
  }

  let avatarUrl: string | null = null;
  if (avatarFile) {
    const filename = (avatarFile as File).name;
    if (agent.avatarUrl) {
      await deleteAgentAvatar(agent.id, getFilenameFromKey(agent.avatarUrl));
    }
    await saveAgentAvatar(
      agent.id,
      filename,
      Buffer.from(await avatarFile.arrayBuffer()),
    );
    avatarUrl = getUrlFromKey(getAgentKey(agent.id, filename));
  } else if (avatarFile === null && agent.avatarUrl) {
    await deleteAgentAvatar(agent.id, getFilenameFromKey(agent.avatarUrl));
  } else {
    avatarUrl = agent.avatarUrl;
  }

  const formTools =
    tools && tools.length > 0
      ? await getToolsByIds(tools, authenticatedUserId)
      : [];
  const formDynamicBlocks =
    dynamicBlocks && dynamicBlocks.length > 0
      ? await getOrCreateDynamicBlocks(authenticatedUserId, dynamicBlocks)
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
      avatarUrl,
      newTools: newTools?.map((tool) => tool),
      newDynamicBlocks: newDynamicBlocks?.map((block) => block),
      removedTools: removedTools?.map((tool) => tool.id),
      removedDynamicBlocks: removedDynamicBlocks?.map((block) => block.id),
    });

    return {
      ...agent,
      ...data,
      avatarUrl,
      createdAt: agent.createdAt,
      tools: tools ? formTools.map((tool) => ({ tool })) : [],
      dynamicBlocks: dynamicBlocks
        ? formDynamicBlocks.map((block) => ({ dynamicBlock: block }))
        : [],
    };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      const message = `An ${visibility} agent with this name already exists`;
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
      description: agent.description,
      heartbeat: agent.heartbeat,
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
