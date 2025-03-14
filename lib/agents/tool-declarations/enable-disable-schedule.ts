import 'server-only';
import { z } from 'zod';

import { validateUUID } from '@/lib/utils';
import { disableSchedule, enableSchedule } from '@/lib/services/automagik';

import { createToolDefinition } from '../tool-declaration';
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

export const enableDisableScheduleTool = createToolDefinition({
  name: InternalToolName.enableDisableSchedule,
  verboseName: 'Enable/Disable Schedule',
  description: 'Enable or disable a schedule by ID',
  visibility: 'public',
  namedRefinements,
  parameters: z.object({
    status: z.enum(['enable', 'disable']),
    scheduleId: z
      .string()
      .superRefine(namedRefinements.validateUUID)
      .describe('The ID of the schedule to enable/disable'),
  }),
  execute: async ({ scheduleId, status }, context) => {
    try {
      const run = status === 'enable' ? enableSchedule : disableSchedule;
      const response = await run(scheduleId, context.abortSignal);

      return { data: response, error: null };
    } catch (error) {
      console.error(error);
      return { data: null, error: 'Error enabling/disabling schedule' };
    }
  },
});
