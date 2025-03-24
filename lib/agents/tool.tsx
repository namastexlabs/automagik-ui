import 'server-only';
import type { Tool as ToolSDK } from 'ai';
import { dezerialize } from 'zodex';
import dedent from 'dedent';
import { z } from 'zod';

import type { Tool } from '@/lib/db/schema';
import { runWorkflow } from '@/lib/services/automagik';

import { toCamelCase } from '../utils';
import type { ExecutionResult, ToolRequestContext } from './types';
import {
  castToolType,
  type InternalToolName,
} from './tool-declarations/client';
import { INTERNAL_TOOL_MAP } from './tool-declarations';
import { createToolDefinition } from './tool-declaration';

export const getInternalTool = <K extends InternalToolName>(name: K) => {
  return INTERNAL_TOOL_MAP[name];
};

export const getToolDefinitionBySource = (tool: Tool) => {
  switch (true) {
    case castToolType('automagik', tool):
      return createChatFlowTool(tool.data.flowId, tool);
    case castToolType('internal', tool):
      return getInternalTool(tool.name as InternalToolName);
    default:
      return null;
  }
};

export const getToolName = (tool: Tool) => {
  return `${tool.source}-${tool.name}`;
};

export const sanitizeVerboseName = (verboseName: string) => {
  return verboseName.replace(/-/g, ' ');
};

export const normalizeVerboseName = (verboseName: string) => {
  return toCamelCase(sanitizeVerboseName(verboseName));
};

export const toCoreTools = (
  tools: Tool[],
  context: ToolRequestContext,
): Record<string, ToolSDK> => {
  return tools.reduce<Record<string, ToolSDK>>((tools, tool) => {
    const toolDefinition = getToolDefinitionBySource(tool);

    const toolName = getToolName(tool);
    tools[toolName] = {
      description: dedent`
        ${tool.description}

        ${toolDefinition?.dynamicDescription?.(context) || ''}
      `,
      parameters: tool.parameters
        ? dezerialize(
            tool.parameters,
            toolDefinition?.namedRefinements
              ? { superRefinements: toolDefinition.namedRefinements as any }
              : {},
          )
        : z.object({}),
      execute: async (parameters) => {
        if (toolDefinition) {
          if (toolDefinition.parameters) {
            return await toolDefinition.execute(parameters, context);
          } else {
            return await toolDefinition.execute(context);
          }
        }

        console.warn(`No tool ${toolName} found for execute, skipping...`);
        return 'No execution';
      },
    };
    return tools;
  }, {});
};

export function createChatFlowTool(
  flowId: string,
  {
    name,
    verboseName,
    description,
    visibility = 'public',
  }: {
    name: string;
    verboseName: string;
    description: string;
    visibility?: 'private' | 'public';
  },
) {
  return createToolDefinition({
    name,
    verboseName,
    description,
    visibility,
    namedRefinements: undefined,
    parameters: z.object({
      inputValue: z.string(),
    }),
    execute: async ({ inputValue }, context): Promise<ExecutionResult> => {
      try {
        const result = await runWorkflow(
          flowId,
          inputValue,
          context.abortSignal,
        );

        return {
          result: result,
          content: 'Flow executed successfully',
        };
      } catch (error) {
        return {
          result: null,
          content: 'Failed to execute flow',
        };
      }
    },
  });
}
