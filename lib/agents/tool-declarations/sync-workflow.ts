import 'server-only';
import { z } from 'zod';

import { createToolDefinition } from '../tool-declaration';
import { syncWorkflow } from '../automagik';
import { InternalToolName } from './client';

export const syncWorkflowTool = createToolDefinition({
  name: InternalToolName.syncWorkflow,
  verboseName: 'Sync workflow',
  description: 'Sync workflow from a remote source to automagik',
  visibility: 'private',
  namedRefinements: undefined,
  parameters: z.object({
    remoteWorkflowId: z.string(),
    inputComponentId: z.string(),
    outputComponentId: z.string(),
  }),
  execute: async ({ remoteWorkflowId, inputComponentId, outputComponentId }) => {
    try {
      const data = await syncWorkflow(
        remoteWorkflowId,
        {
          input_component: inputComponentId,
          output_component: outputComponentId,
        },
      );

      if (data) {
        return {
          data: {
            id: data.id,
            name: data.name,
            source: data.source,
            sourceId: data.source_id,
            folderId: data.folder_id,
            folderName: data.folder_name,
          },
          error: null,
        };
      }
    } catch (error) {
      console.error(error);
    }

    return { data: null, error: 'Flow not found' };
  },
});
