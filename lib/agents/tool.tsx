import type { CoreTool } from 'ai';

import type { Source, ToolData, ToolRequestContext } from './types';
import type { InternalToolName } from './tool-declarations/client';
import type { Tool } from '../db/schema';
import { INTERNAL_TOOL_MAP } from './tool-declarations';
import { dezerialize } from 'zodex';
import dedent from 'dedent';
import { createChatFlowTool } from './langflow';

export const getInternalTool = <K extends InternalToolName>(name: K) => {
  return INTERNAL_TOOL_MAP[name];
};

const castToolType = <T extends Source>(
  source: T,
  tool: Tool,
): tool is Tool & { source: T; data: ToolData<T> } => {
  return tool.source === source;
};

const getToolDefinitionBySource = (tool: Tool) => {
  switch (true) {
    case castToolType('langflow', tool):
      return createChatFlowTool(tool.data.flowId, tool);
    case castToolType('internal', tool):
      return getInternalTool(tool.name as InternalToolName);
    default:
      return null;
  }
};

export const toCoreTools = (
  tools: Tool[],
  context: ToolRequestContext,
): Record<string, CoreTool> => {
  return tools.reduce<Record<string, CoreTool>>((tools, tool) => {
    const toolDefinition = getToolDefinitionBySource(tool);

    tools[tool.name] = {
      description: dedent`
        ${tool.description}

        ${toolDefinition?.dynamicDescription?.(context) || ''}
      `,
      parameters: dezerialize(tool.parameters),
      execute: async (parameters) => {
        if (toolDefinition) {
          return await toolDefinition.execute(parameters, context);
        } else {
          console.warn(`No tool ${tool.name} found for execute, skipping...`);
          return 'No execution';
        }
      },
    };
    return tools;
  }, {});
};
