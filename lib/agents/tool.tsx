import type { CoreTool } from 'ai';

import type { ToolRequestContext } from './types';
import {
  type InternalToolName,
  internalToolNames,
} from './tool-declarations/client';
import type { Tool } from '../db/schema';
import { INTERNAL_TOOL_MAP } from './tool-declarations';
import { dezerialize } from 'zodex';

export const getInternalTool = <K extends InternalToolName>(name: K) => {
  return INTERNAL_TOOL_MAP[name];
};

export const toCoreTools = (
  tools: Tool[],
  context: ToolRequestContext,
): Record<string, CoreTool> => {
  return tools.reduce<Record<string, CoreTool>>((tools, tool) => {
    tools[tool.name] = {
      description: tool.description,
      parameters: dezerialize(tool.parameters),
      execute: async (parameters) => {
        if (!internalToolNames.includes(tool.name)) {
          console.warn(`No tool ${tool.name} found for execute, skipping...`);
          return;
        }

        return await getInternalTool(tool.name as InternalToolName).execute(
          parameters,
          context,
        );
      },
    };
    return tools;
  }, {});
};
