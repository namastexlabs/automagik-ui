import 'server-only';

import { z } from 'zod';

import { getSchedules } from '@/lib/services/automagik';

import { createToolDefinition } from '../tool-declaration';
import { InternalToolName } from './client';

export const listSchedulesTool = createToolDefinition({
  name: InternalToolName.listSchedules,
  verboseName: 'List Schedules',
  description: 'List 10 schedules per page',
  visibility: 'public',
  namedRefinements: undefined,
  parameters: z.object({
    page: z.number().default(0),
  }),
  execute: async ({ page }, context) => {
    try {
      const schedules = await getSchedules(context.abortSignal);
      return {
        page,
        data: {
          items: schedules.slice(page * 10, (page + 1) * 10),
          total: schedules.length,
        },
        error: null,
      };
    } catch (error) {
      console.error(error);
      return { data: null, error: 'Error fetching schedules' };
    }
  },
});
