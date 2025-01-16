/**
 * Data access layer for client-side
 */

import 'server-only';
import type { AgentData } from '@/lib/db/queries';

export const mapAgent = (agent: AgentData) => {
  return {
    ...agent,
    tools: agent.tools.map(({ tool: { id, name, verboseName, source } }) => ({
      id,
      name,
      verboseName,
      source,
    })),
    dynamicBlocks: agent.dynamicBlocks.map(({ name }) => ({
      name,
    })),
  };
};

export type ClientAgent = ReturnType<typeof mapAgent>;
