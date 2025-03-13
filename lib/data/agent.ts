/**
 * @fileoverview Top-level layer for the agent resource.
 * It is responsible for fetching and saving agents on API routes, server actions, and server components.
 * It also contains DTOs and schema for the agent form.
 * Use `lib/repositories`, to interact with the database and handle business logic.
 */

import 'server-only';
import { z } from 'zod';

import type { AgentData } from '@/lib/db/queries/agent';
import {
  getUserAgents,
  updateAgent,
  createAgent,
  duplicateAgent as duplicateAgentRepository,
  removeAgent as removeAgentRepository,
} from '@/lib/repositories/agent';
import { getUser } from '@/lib/auth';
import { ApplicationError } from '@/lib/errors';

import {
  type DataResponse,
  type ZodLooseInfer,
  handleApplicationError,
  handleDataError,
} from './index.server';
import { DataStatus } from '.';

const agentSchema = z.object({
  name: z.string().trim(),
  systemPrompt: z.string(),
  visibility: z.enum(['public', 'private']).default('private'),
  tools: z.array(z.string()).default([]),
  dynamicBlocks: z
    .array(
      z.object({
        name: z.string().trim(),
        visibility: z.enum(['public', 'private']),
      }),
    )
    .refine(
      (items) => new Set(items.map((item) => item.name)).size === items.length,
      { message: 'Dynamic block names must be unique' },
    )
    .default([]),
});

export type AgentSchema = typeof agentSchema;

export function toAgentDTO(
  authUserId: string,
  {
    id,
    name,
    userId,
    visibility,
    systemPrompt,
    tools,
    dynamicBlocks,
  }: AgentData,
) {
  return {
    id,
    name,
    userId,
    visibility,
    systemPrompt: userId !== authUserId ? undefined : systemPrompt,
    tools: tools.map(
      ({ tool: { id, name, verboseName, visibility, data, source } }) => ({
        id,
        name,
        verboseName,
        visibility,
        data,
        source,
      }),
    ),
    dynamicBlocks: dynamicBlocks.map(
      ({ dynamicBlock: { name, visibility } }) => ({
        name,
        visibility,
      }),
    ),
  };
}

export type AgentDTO = ReturnType<typeof toAgentDTO>;

export async function getInitialAgents(): Promise<
  DataResponse<AgentDTO[], any>
> {
  try {
    const session = await getUser();

    const agents = await getUserAgents(session.user.id);
    return {
      status: DataStatus.Success,
      data: agents.map((agent) => toAgentDTO(session.user.id, agent)),
    };
  } catch (error) {
    return handleDataError(error, []);
  }
}

export async function saveAgent(
  values: ZodLooseInfer<AgentSchema>,
  id?: string,
): Promise<DataResponse<AgentDTO | null, z.infer<AgentSchema>>> {
  try {
    const validatedData = agentSchema.parse(values);

    const session = await getUser();

    const data = {
      userId: session.user.id,
      ...validatedData,
    };

    const agent = await (id ? updateAgent({ id, ...data }) : createAgent(data));
    return {
      status: DataStatus.Success,
      data: toAgentDTO(session.user.id, agent),
    };
  } catch (error) {
    return handleDataError(error);
  }
}

export async function duplicateAgent(
  id: string,
): Promise<DataResponse<AgentDTO | null, z.infer<AgentSchema>>> {
  const session = await getUser();

  try {
    const agent = await duplicateAgentRepository(id, session.user.id);
    return {
      status: DataStatus.Success,
      data: toAgentDTO(session.user.id, agent),
    };
  } catch (error) {
    if (error instanceof ApplicationError) {
      return handleApplicationError(error);
    }

    throw error;
  }
}

export async function deleteAgent(id: string): Promise<DataResponse<null>> {
  const session = await getUser();

  try {
    await removeAgentRepository(id, session.user.id);
    return {
      status: DataStatus.Success,
      data: null,
    };
  } catch (error) {
    return handleDataError(error);
  }
}
