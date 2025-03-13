import { z } from 'zod';

import { validateUUID } from '@/lib/utils';

import { runWorkflow } from '@/lib/services/automagik';

import { createToolDefinition } from '../tool-declaration';
import type { ExecutionResult } from '../types';
import { InternalToolName } from './client';

const namedRefinements = {
  validateUUID: (id: string, ctx: z.RefinementCtx) => {
    if (!validateUUID(id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalid UUID',
      });
    }
  },
};

export const runWorkflowTool = createToolDefinition({
  name: InternalToolName.runWorkflow,
  verboseName: 'Run Workflow',
  description: 'Run a workflow with an input value',
  visibility: 'public',
  namedRefinements,
  parameters: z.object({
    inputValue: z.string(),
    flowId: z
      .string()
      .superRefine(namedRefinements.validateUUID)
      .describe('The UUID of the workflow to run'),
  }),
  execute: async ({ inputValue, flowId }): Promise<ExecutionResult> => {
    try {
      const result = await runWorkflow(flowId, inputValue);

      return {
        result: result,
        content: 'Flow executed successfully',
      };
    } catch (error) {
      return {
        result: null,
        content: 'Failed to execute flow',
      };
    }
  },
});
