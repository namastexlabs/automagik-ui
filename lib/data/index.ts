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
  visibility,
  description,
}: Tool) => {
  return {
    id,
    name,
    verboseName,
    source,
    data,
    visibility,
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
    dynamicBlocks: agent.dynamicBlocks.map(
      ({ dynamicBlock: { name, visibility } }) => ({
        name,
        visibility,
      }),
    ),
  };
};

export type ClientAgent = ReturnType<typeof mapAgent>;
