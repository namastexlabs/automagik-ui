import 'server-only';

import { z } from 'zod';

import { getRemoteWorkflows } from '@/lib/services/automagik';

import { createToolDefinition } from '../tool-declaration';
import { InternalToolName } from './client';

export const listRemoteWorkflowsTool = createToolDefinition({
  name: InternalToolName.listRemoteWorkflows,
  verboseName: 'List Remote Workflows',
  description: 'List 10 workflows per page from remote sources',
  visibility: 'public',
  namedRefinements: undefined,
  parameters: z.object({
    page: z.number().default(0),
  }),
  execute: async ({ page }) => {
    try {
      const workflows = await getRemoteWorkflows();
      return {
        page,
        data: {
          items: workflows.slice(page * 10, (page + 1) * 10),
          total: workflows.length,
        },
        error: null,
      };
    } catch (error) {
      console.error(error);
      return { data: null, error: 'Error fetching remote workflows' };
    }
  },
});
