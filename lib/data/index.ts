/**
 * Data access layer for DTO conversion
 */

import 'server-only';
import type { AgentData } from '@/lib/db/queries';
import type { Tool } from '../db/schema';

export const mapTool = ({
  id,
  name,
  verboseName,
  source,
  data,
  description,
}: Tool) => {
  return {
    id,
    name,
    verboseName,
    source,
    data,
    description: source === 'internal' ? undefined : description,
  };
};

export type ClientTool = ReturnType<typeof mapTool>;

export const mapAgent = (agent: AgentData) => {
  return {
    ...agent,
    tools: agent.tools.map(({ tool: { id, name, verboseName } }) => ({
      id,
      name,
      verboseName,
    })),
    dynamicBlocks: agent.dynamicBlocks.map(({ name }) => ({
      name,
    })),
  };
};

export type ClientAgent = ReturnType<typeof mapAgent>;
