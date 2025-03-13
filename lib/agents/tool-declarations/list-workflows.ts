import 'server-only';

import { getWorkflows } from '@/lib/services/automagik';

import { createToolDefinition } from '../tool-declaration';
import { InternalToolName } from './client';

export const listWorkflowsTool = createToolDefinition({
  name: InternalToolName.listWorkflows,
  verboseName: 'List synced Workflows',
  description: 'List synced workflows between a remote source and Automagik',
  visibility: 'public',
  namedRefinements: undefined,
  parameters: undefined,
  execute: async () => {
    try {
      const workflows = await getWorkflows();
      return {
        data: workflows.map((workflow) => ({
          id: workflow.id,
          name: workflow.name,
          description: workflow.description,
        })),
        error: null,
      };
    } catch (error) {
      return { data: null, error: 'Error fetching workflows' };
    }
  },
});
