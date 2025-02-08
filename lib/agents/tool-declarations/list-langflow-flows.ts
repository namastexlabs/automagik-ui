import 'server-only';

import type { FlowPayload } from '../types';
import { createToolDefinition } from '../tool-declaration';
import { InternalToolName } from './client';
import { getFlowsFromLangFlow } from '../automagik';

export const listLangflowFlowsTool = createToolDefinition({
  name: InternalToolName.listLangflowFlows,
  verboseName: 'List Langflow Flows',
  description: 'List flows from Langflow',
  visibility: 'private',
  parameters: undefined,
  execute: async () => {
    try {
      const flows = await getFlowsFromLangFlow();
      const result = flows.map((flow) => ({
        id: flow.id,
        name: flow.name,
        description: flow.description,
        nodes: flow.data.nodes.reduce<FlowPayload['nodes']>(
          (acc, component) => {
            if (['ChatInput', 'ChatOutput'].includes(component.data.type)) {
              acc.push({
                id: component.id,
                type: component.data.type,
              });
            }

            return acc;
          },
          [],
        ),
      }));

      return { data: result, error: null };
    } catch (error) {
      console.error(error);
      return { data: null, error: 'Error fetching flows' };
    }
  },
});
