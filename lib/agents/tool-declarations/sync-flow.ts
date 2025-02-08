import 'server-only';
import { z } from 'zod';

import { createToolDefinition } from '../tool-declaration';
import { InternalToolName } from './client';
import {
  getFlowsFromLangFlowById,
  getFolderById,
  syncFlow,
} from '../automagik';

export const syncFlowTool = createToolDefinition({
  name: InternalToolName.syncFlow,
  verboseName: 'Sync Flow',
  description: 'Sync flow between Langflow and Automagik',
  visibility: 'private',
  parameters: z.object({
    flow: z.object({
      id: z.string(),
      inputComponentId: z.string(),
      outputComponentId: z.string(),
    }),
  }),
  execute: async (params) => {
    const { flow } = params;
    const flowData = await getFlowsFromLangFlowById(flow.id);

    if (!flowData) {
      return { data: null, error: 'Flow not found' };
    }

    let folder = null;
    try {
      folder = await getFolderById(flowData.folder_id);
    } catch (error) {
      console.error(error);
    }

    try {
      const data = await syncFlow({
        name: flowData.name,
        description: flowData.description,
        source: 'langflow',
        is_component: false,
        folder_id: flowData.folder_id,
        folder_name: folder?.name || 'none',
        source_id: flow.id,
        input_component: flow.inputComponentId,
        output_component: flow.outputComponentId,
        data: flowData.data,
      });

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
