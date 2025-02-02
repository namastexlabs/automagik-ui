import type { CoreTool } from 'ai';

import type { ToolRequestContext } from './types';
import type { InternalToolName } from './tool-declarations/client';
import type { Tool } from '../db/schema';
import { INTERNAL_TOOL_MAP } from './tool-declarations';
import { dezerialize } from 'zodex';
import dedent from 'dedent';

export const getInternalTool = <K extends InternalToolName>(name: K) => {
  return INTERNAL_TOOL_MAP[name];
};

export const toCoreTools = (
  tools: Tool[],
  context: ToolRequestContext,
): Record<string, CoreTool> => {
  return tools.reduce<Record<string, CoreTool>>((tools, tool) => {
    const internalTool =
      tool.source === 'internal'
        ? getInternalTool(tool.name as InternalToolName)
        : null;

    tools[tool.name] = {
      description: dedent`
        ${tool.description}

        ${internalTool?.dynamicDescription?.(context) || ''}
      `,
      parameters: dezerialize(tool.parameters),
      execute: async (parameters) => {
        if (!internalTool) {
          console.warn(`No tool ${tool.name} found for execute, skipping...`);
          return;
        }

        return await internalTool.execute(parameters, context);
      },
    };
    return tools;
  }, {});
};
