import type { z } from 'zod';
import type { ToolDefinition } from './types';

export const createToolDefinition = <N extends string, R, P extends z.ZodTypeAny>(
  toolDefinition: ToolDefinition<N, R, P>,
): ToolDefinition<N, R, P> => {
  return toolDefinition;
};
