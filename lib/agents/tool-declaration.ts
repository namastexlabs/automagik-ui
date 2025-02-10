import type { ToolDefinition } from './types';

export const createToolDefinition = <N extends string, R, P>(
  toolDefinition: ToolDefinition<N, R, P>,
): ToolDefinition<N, R, P> => {
  return toolDefinition;
};
