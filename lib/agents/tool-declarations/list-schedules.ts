import 'server-only';

import { z } from 'zod';
import { createToolDefinition } from '../tool-declaration';
import { InternalToolName } from './client';
import { getSchedules } from '../automagik';

export const listSchedulesTool = createToolDefinition({
  name: InternalToolName.listSchedules,
  verboseName: 'List Schedules',
  description: 'List 10 schedules per page',
  visibility: 'public',
  namedRefinements: undefined,
  parameters: z.object({
    page: z.number().default(0),
  }),
  execute: async ({ page }) => {
    try {
      const schedules = await getSchedules();
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
      return { data: null, error: 'Error fetching remote workflows' };
    }
  },
});
