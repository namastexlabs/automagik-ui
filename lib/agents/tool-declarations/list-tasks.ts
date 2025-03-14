import 'server-only';

import { getTasks } from '@/lib/services/automagik';

import { createToolDefinition } from '../tool-declaration';
import { InternalToolName } from './client';

export const listTasksTool = createToolDefinition({
  name: InternalToolName.listTasks,
  verboseName: 'List Tasks',
  description: 'List tasks from Automagik',
  visibility: 'public',
  namedRefinements: undefined,
  parameters: undefined,
  execute: async (context) => {
    try {
      const data = await getTasks(context.abortSignal);
      return { data, error: null };
    } catch (error) {
      console.error(error);
      return { data: null, error: 'Error fetching tasks' };
    }
  },
});
