import 'server-only';
import { z } from 'zod';

import { validateUUID } from '@/lib/utils';
import { deleteSchedule } from '@/lib/services/automagik';

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

export const deleteScheduleTool = createToolDefinition({
  name: InternalToolName.deleteSchedule,
  verboseName: 'Delete Schedule',
  description: 'Delete a schedule by ID',
  visibility: 'public',
  namedRefinements,
  parameters: z.object({
    scheduleId: z
      .string()
      .superRefine(namedRefinements.validateUUID)
      .describe('The ID of the schedule to delete'),
  }),
  execute: async ({ scheduleId }) => {
    try {
      await deleteSchedule(scheduleId);

      return { data: { message: 'Schedule deleted successfully' }, error: null };
    } catch (error) {
      console.error(error);
      return { data: null, error: 'Error deleting schedule' };
    }
  },
});
