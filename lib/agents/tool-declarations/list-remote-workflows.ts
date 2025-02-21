import 'server-only';

import { z } from 'zod';
import { createToolDefinition } from '../tool-declaration';
import { InternalToolName } from './client';
import { getRemoteWorkflows } from '../automagik';

export const listRemoteWorkflowsTool = createToolDefinition({
  name: InternalToolName.listRemoteWorkflows,
  verboseName: 'List Remote Workflows',
  description: 'List 10 workflows per pagefrom remote sources',
  visibility: 'private',
  namedRefinements: undefined,
  parameters: z.object({
    page: z.number().optional(),
  }),
  execute: async ({ page = 0 }) => {
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
