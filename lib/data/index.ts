/**
 * Data access layer for DTO conversion
 */

import 'server-only';
import type { AgentData } from '@/lib/db/queries/agent';
import type { Tool } from '../db/schema';

export const mapTool = (
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
) => {
  return {
    id,
    name,
    verboseName,
    source,
    data,
    visibility,
    description: userId !== authUserId ? undefined : description,
  };
};

export type ClientTool = ReturnType<typeof mapTool>;

export const mapAgent = (
  authUserId: string,
  {
    id,
    name,
    userId,
    systemPrompt,
    visibility,
    tools,
    dynamicBlocks,
  }: AgentData,
) => {
  return {
    id,
    name,
    userId,
    visibility,
    systemPrompt: userId !== authUserId ? undefined : systemPrompt,
    tools: tools.map(({ tool: { id, name, verboseName, visibility, data, source } }) => ({
      id,
      name,
      verboseName,
      visibility,
      data,
      source,
    })),
    dynamicBlocks: dynamicBlocks.map(
      ({ dynamicBlock: { name, visibility } }) => ({
        name,
        visibility,
      }),
    ),
  };
};

export type ClientAgent = ReturnType<typeof mapAgent>;
