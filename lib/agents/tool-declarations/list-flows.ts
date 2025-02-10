import 'server-only';

import { createToolDefinition } from '../tool-declaration';
import { getFlows } from '../automagik';
import { InternalToolName } from './client';

export const listFlowsTool = createToolDefinition({
  name: InternalToolName.listFlows,
  verboseName: 'List synced Flows',
  description: 'List synced flows between Langflow and Automagik',
  visibility: 'private',
  parameters: undefined,
  execute: async () => {
    try {
      const flows = await getFlows();
      return {
        data: flows.map((flow) => ({
          id: flow.id,
          name: flow.name,
          description: flow.description,
        })),
        error: null,
      };
    } catch (error) {
      return { data: null, error: 'Error fetching flows' };
    }
  },
});
