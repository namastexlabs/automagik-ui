import 'server-only';

import { createToolDefinition } from '../tool-declaration';
import { getWorkflows } from '../automagik';
import { InternalToolName } from './client';

export const listWorkflowsTool = createToolDefinition({
  name: InternalToolName.listWorkflows,
  verboseName: 'List synced Workflows',
  description: 'List synced workflows between a remote source and Automagik',
  visibility: 'private',
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
