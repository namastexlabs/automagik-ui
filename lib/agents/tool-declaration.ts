import type { z } from 'zod';
import type { ToolDefinition } from './types';

export const createToolDefinition = <
  N extends string,
  R,
  P,
  REFINEMENTS extends Record<
    string,
    (value: any, ctx: z.RefinementCtx) => any
  > | undefined = any,
>(
  toolDefinition: ToolDefinition<N, R, P, REFINEMENTS>,
): ToolDefinition<N, R, P, REFINEMENTS> => {
  return toolDefinition;
};
