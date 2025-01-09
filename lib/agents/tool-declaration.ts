import type { z } from 'zod';
import type { ToolDefinition } from './types';

export const createToolDefinition = <
  N extends string,
  R,
  P extends z.ZodTypeAny,
>({
  name,
  verboseName,
  description,
  parameters,
  execute,
}: ToolDefinition<N, R, P>): ToolDefinition<N, R, P> => {
  return {
    name,
    verboseName,
    description,
    parameters,
    execute,
  };
};
