import 'server-only';

import { createToolDefinition } from '../tool-declaration';
import { createSchedule } from '../automagik';
import { InternalToolName } from './client';
import { z } from 'zod';

export const scheduleFlowTool = createToolDefinition({
  name: InternalToolName.scheduleFlow,
  verboseName: 'Schedule Flow',
  description: 'Schedule a flow to run at a specific interval or cron',
  visibility: 'private',
  parameters: z.object({
    schedule: z.object({
      flowId: z.string(),
      scheduleType: z.enum(['cron', 'interval']),
      scheduleValue: z.string({
        description: 'The interval(5m, 1h...) or cron(* * * * *) value',
      }),
    }),
  }),
  execute: async ({ schedule }) => {
    try {
      const data = await createSchedule({
        flow_id: schedule.flowId,
        schedule_type: schedule.scheduleType,
        schedule_expr: schedule.scheduleValue,
        next_run_at: new Date().toISOString(),
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
