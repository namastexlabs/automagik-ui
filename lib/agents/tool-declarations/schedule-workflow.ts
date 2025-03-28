import 'server-only';

import { createSchedule } from '@/lib/services/automagik';

import { createToolDefinition } from '../tool-declaration';
import { InternalToolName } from './client';
import { z } from 'zod';

export const scheduleWorkflowTool = createToolDefinition({
  name: InternalToolName.scheduleWorkflow,
  verboseName: 'Schedule Workflow',
  description: 'Schedule a workflow to run at a specific interval or cron',
  visibility: 'public',
  namedRefinements: undefined,
  parameters: z.object({
    schedule: z.object({
      workflowId: z.string(),
      inputValue: z.string(),
      scheduleType: z.enum(['cron', 'interval']),
      scheduleValue: z.string({
        description: 'The interval(5m, 1h...) or cron(* * * * *) value',
      }),
    }),
  }),
  execute: async ({ schedule }, context) => {
    try {
      const data = await createSchedule({
        workflow_id: schedule.workflowId,
        input_value: schedule.inputValue,
        schedule_type: schedule.scheduleType,
        schedule_expr: schedule.scheduleValue,
      }, context.abortSignal);
      return {
        data,
        error: null,
      };
    } catch (error) {
      return { data: null, error: 'Error scheduling workflow' };
    }
  },
});
