/**
 * @fileoverview Top-level layer for the tool resource.
 * It is responsible for fetching and saving tools on API routes, server actions, and server components.
 * It also contains DTOs and schema for the tool form.
 * Use `lib/repositories`, to interact with the database and handle business logic.
 */

import 'server-only';
import { z } from 'zod';

import {
  createFlowTool,
  getUserAvailableTools,
  updateFlowTool,
} from '@/lib/repositories/tool';
import type { Tool } from '@/lib/db/schema';
import { getUser } from '@/lib/auth';

import {
  type DataResponse,
  type ZodLooseInfer,
  handleDataError,
} from './index.server';
import { DataStatus } from '.';
const flowToolSchema = z.object({
  verboseName: z.string().trim(),
  description: z.string(),
  flowId: z.string().trim(),
  visibility: z.enum(['public', 'private']).default('private'),
});

export type FlowToolSchema = typeof flowToolSchema;

export function toToolDTO(
  authUserId: string,
  {
    id,
    name,
    verboseName,
    source,
    data,
    visibility,
    description,
    userId,
  }: Tool,
) {
  return {
    id,
    name,
    verboseName,
    source,
    data,
    visibility,
    description: userId !== authUserId ? undefined : description,
  };
}

export type ToolDTO = ReturnType<typeof toToolDTO>;

export async function getInitialTools(): Promise<DataResponse<ToolDTO[]>> {
  const session = await getUser();

  const tools = await getUserAvailableTools(session.user.id);
  return {
    status: DataStatus.Success,
    data: tools.map((tool) => toToolDTO(session.user.id, tool)),
  };
}

export async function saveFlowTool(
  values: ZodLooseInfer<FlowToolSchema>,
  id?: string,
): Promise<DataResponse<ToolDTO | null, z.infer<FlowToolSchema>>> {
  try {
    const session = await getUser();
    const validatedData = flowToolSchema.parse(values);

    const data = {
      ...validatedData,
      userId: session.user.id,
    };
    const tool = await (id
      ? updateFlowTool({ id, ...data })
      : createFlowTool(data));

    return {
      status: DataStatus.Success,
      data: toToolDTO(session.user.id, tool),
    };
  } catch (error) {
    return handleDataError(error);
  }
}
