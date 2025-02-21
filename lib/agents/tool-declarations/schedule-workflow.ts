import 'server-only';

import { createToolDefinition } from '../tool-declaration';
import { createSchedule } from '../automagik';
import { InternalToolName } from './client';
import { z } from 'zod';

export const scheduleWorkflowTool = createToolDefinition({
  name: InternalToolName.scheduleWorkflow,
  verboseName: 'Schedule Workflow',
  description: 'Schedule a workflow to run at a specific interval or cron',
  visibility: 'private',
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
  execute: async ({ schedule }) => {
    try {
      const data = await createSchedule({
        workflow_id: schedule.workflowId,
        input_value: schedule.inputValue,
        schedule_type: schedule.scheduleType,
        schedule_expr: schedule.scheduleValue,
      });
      return {
        data,
        error: null,
      };
    } catch (error) {
      return { data: null, error: 'Error scheduling flow' };
    }
  },
});
