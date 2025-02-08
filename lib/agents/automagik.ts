import 'server-only';
import { z } from 'zod';
import { createToolDefinition } from './tool-declaration';
import type { ExecutionResult, FlowData, LangFlowResponse } from './types';

const AUTOMAGIK_URL = process.env.AUTOMAGIK_URL;
const AUTOMAGIK_API_KEY = process.env.AUTOMAGIK_API_KEY;

const LANGFLOW_URL = process.env.LANGFLOW_URL;
const LANGFLOW_API_KEY = process.env.LANGFLOW_API_KEY;

export async function getFlowsFromLangFlow() {
  if (!LANGFLOW_URL || !LANGFLOW_API_KEY) {
    console.error('Missing credentials for Langflow');
    return [];
  }

  const response = await fetch(`${LANGFLOW_URL}/api/v1/flows/`, {
    method: 'GET',
    headers: {
      accept: 'application/json',
      'x-api-key': LANGFLOW_API_KEY,
    },
  });

  const data: LangFlowResponse[] = await response.json();
  return data;
}

export async function getFlowsFromLangFlowById(id: string) {
  if (!LANGFLOW_URL || !LANGFLOW_API_KEY) {
    console.error('Missing credentials for Langflow');
    return null;
  }

  const response = await fetch(`${LANGFLOW_URL}/api/v1/flows/${id}`, {
    method: 'GET',
    headers: {
      accept: 'application/json',
      'x-api-key': LANGFLOW_API_KEY,
    },
  });

  const data: LangFlowResponse = await response.json();
  return data;
}

export async function getFolderById(id: string) {
  if (!LANGFLOW_URL || !LANGFLOW_API_KEY) {
    console.error('Missing credentials for Langflow');
    return null;
  }

  const response = await fetch(`${LANGFLOW_URL}/api/v1/folders/${id}`, {
    method: 'GET',
    headers: {
      accept: 'application/json',
      'x-api-key': LANGFLOW_API_KEY,
    },
  });

  const data: { name: string; id: string } = await response.json();
  return data;
}

export async function getFlows() {
  if (!AUTOMAGIK_URL || !AUTOMAGIK_API_KEY) {
    console.error('Missing credentials for Automagik');
    return [];
  }

  const response = await fetch(`${AUTOMAGIK_URL}/api/v1/flows/`, {
    method: 'GET',
    headers: {
      accept: 'application/json',
      'x-api-key': AUTOMAGIK_API_KEY,
    },
  });

  const data: FlowData[] = await response.json();
  return data;
}

export async function syncFlow(
  params: Omit<FlowData, 'id' | 'created_at' | 'updated_at'>,
) {
  if (!AUTOMAGIK_URL || !AUTOMAGIK_API_KEY) {
    console.error('Missing credentials for Automagik');
    return null;
  }

  const response = await fetch(`${AUTOMAGIK_URL}/api/v1/flows/`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'Content-Type': 'application/json',
      'x-api-key': AUTOMAGIK_API_KEY,
    },
    body: JSON.stringify(params),
  });

  const data: FlowData = await response.json();
  return data;
}

export function createChatFlowTool(
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
) {
  return createToolDefinition({
    name,
    verboseName,
    description,
    visibility: 'private',
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
}
