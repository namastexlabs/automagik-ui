import 'server-only';
import { z } from 'zod';
import { createToolDefinition } from './tool-declaration';
import type { ExecutionResult, FlowData } from './types';

const AUTOMAGIK_URL = process.env.AUTOMAGIK_URL;
const AUTOMAGIK_API_KEY = process.env.AUTOMAGIK_API_KEY;

export const getFlows = async () => {
  if (!AUTOMAGIK_URL || !AUTOMAGIK_API_KEY) {
    console.error('Missing credentials for Automagik');
    return [];
  }

  const response = await fetch(`${AUTOMAGIK_URL}/api/v1/flows`, {
    method: 'GET',
    headers: {
      'x-api-key': AUTOMAGIK_API_KEY,
    },
  });

  const data: FlowData[] = await response.json();
  return data;
};

export const createChatFlowTool = (
  flowId: string,
  {
    name,
    verboseName,
    description,
  }: {
    name: string;
    verboseName: string;
    description: string;
  },
) => {
  return createToolDefinition({
    name,
    verboseName,
    description,
    parameters: z.object({
      inputValue: z.string(),
    }),
    execute: async ({ inputValue }): Promise<ExecutionResult> => {
      // TODO: AUTOMAGIK SCHEDULE/RUN TASK

      return {
        result: '',
        content: 'Flow executed successfully',
      };
    },
  });
};
