import 'server-only';

import { createToolDefinition } from '../tool-declaration';
import { InternalToolName } from './client';
import { getTasks } from '../automagik';

export const listTasksTool = createToolDefinition({
  name: InternalToolName.listTasks,
  verboseName: 'List Tasks',
  description: 'List tasks from Automagik',
  visibility: 'public',
  namedRefinements: undefined,
  parameters: undefined,
  execute: async () => {
    try {
      const data = await getTasks();
      return { data, error: null };
    } catch (error) {
      console.error(error);
      return { data: null, error: 'Error fetching tasks' };
    }
  },
});
