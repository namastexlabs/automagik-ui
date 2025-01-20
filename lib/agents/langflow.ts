import 'server-only';
import { z } from 'zod';
import { createToolDefinition } from './tool-declaration';
import type { ExecutionResult, LangflowResponse } from './types';

const LANGFLOW_URL = process.env.LANGFLOW_URL;
const LANGFLOW_API_KEY = process.env.LANGFLOW_API_KEY;

const runFlow = async (inputValue: string, flowId: string) => {
  if (!LANGFLOW_URL || !LANGFLOW_API_KEY) {
    console.error('Missing credentials for Langflow');
    return null;
  }

  const response = await fetch(`${LANGFLOW_URL}/api/v1/run/${flowId}`, {
    method: 'POST',
    headers: {
      'x-api-key': LANGFLOW_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input_type: 'chat',
      output_type: 'chat',
      input_value: inputValue,
    }),
  });

  const data: LangflowResponse = await response.json();
  console.log(data);
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
      const data = await runFlow(inputValue, flowId);

      if (!data) {
        return { result: null, content: 'Flow execution failed' };
      }

      return {
        result: data.outputs[0].outputs[0].artifacts.message,
        content: 'Flow executed successfully',
      };
    },
  });
};
