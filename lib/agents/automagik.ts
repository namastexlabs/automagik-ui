import 'server-only';
import { z } from 'zod';
import { createToolDefinition } from './tool-declaration';
import type { ExecutionResult, FlowData, LangFlowResponse, Schedule, Task } from './types';

const AUTOMAGIK_URL = process.env.AUTOMAGIK_URL || '';
const AUTOMAGIK_API_KEY = process.env.AUTOMAGIK_API_KEY || '';

const LANGFLOW_URL = process.env.LANGFLOW_URL || '';
const LANGFLOW_API_KEY = process.env.LANGFLOW_API_KEY || '';

const checkLangflowCredentials = () => {
  if (!LANGFLOW_URL || !LANGFLOW_API_KEY) {
    console.error('Missing credentials for Langflow');
    return false;
  }
  return true;
};

const checkAutomagikCredentials = () => {
  if (!AUTOMAGIK_URL || !AUTOMAGIK_API_KEY) {
    console.error('Missing credentials for Automagik');
    return false;
  }
  return true;
};

const LANGFLOW_HEADERS = {
  'x-api-key': LANGFLOW_API_KEY,
  accept: 'application/json',
  'Content-Type': 'application/json',
};

const AUTOMAGIK_HEADERS = {
  'x-api-key': AUTOMAGIK_API_KEY,
  'Content-Type': 'application/json',
  accept: 'application/json',
};

export async function getFlowsFromLangFlow() {
  if (!checkLangflowCredentials()) {
    return [];
  }

  const response = await fetch(`${LANGFLOW_URL}/api/v1/flows/`, {
    method: 'GET',
    headers: LANGFLOW_HEADERS,
  });

  const data: LangFlowResponse[] = await response.json();
  return data;
}

export async function getFlowsFromLangFlowById(id: string) {
  if (!checkLangflowCredentials()) {
    return null;
  }

  const response = await fetch(`${LANGFLOW_URL}/api/v1/flows/${id}`, {
    method: 'GET',
    headers: LANGFLOW_HEADERS,
  });

  const data: LangFlowResponse = await response.json();
  return data;
}

export async function getFolderById(id: string) {
  if (!checkLangflowCredentials()) {
    return null;
  }

  const response = await fetch(`${LANGFLOW_URL}/api/v1/folders/${id}`, {
    method: 'GET',
    headers: LANGFLOW_HEADERS,
  });

  const data: { name: string; id: string } = await response.json();
  return data;
}

export async function getFlows() {
  if (!checkAutomagikCredentials()) {
    return [];
  }

  const response = await fetch(`${AUTOMAGIK_URL}/api/v1/flows/`, {
    method: 'GET',
    headers: AUTOMAGIK_HEADERS,
  });

  const data: FlowData[] = await response.json();
  return data;
}

export async function syncFlow(
  params: Omit<FlowData, 'id' | 'created_at' | 'updated_at'>,
) {
  if (!checkAutomagikCredentials()) {
    return null;
  }

  const response = await fetch(`${AUTOMAGIK_URL}/api/v1/flows/`, {
    method: 'POST',
    headers: AUTOMAGIK_HEADERS,
    body: JSON.stringify(params),
  });

  const data: FlowData = await response.json();
  return data;
}

export async function createSchedule(params: {
  next_run_at: string;
  flow_id: string;
  schedule_type: 'interval' | 'cron';
  schedule_expr: string;
}) {
  if (!checkAutomagikCredentials()) {
    console.error('Missing credentials for Automagik');
    return null;
  }

  const response = await fetch(`${AUTOMAGIK_URL}/api/v1/schedules/`, {
    method: 'POST',
    headers: AUTOMAGIK_HEADERS,
    body: JSON.stringify(params),
  });

  const data: Schedule = await response.json();
  return data;
}

export async function getTasks() {
  if (!checkAutomagikCredentials()) {
    return [];
  }

  const response = await fetch(`${AUTOMAGIK_URL}/api/v1/tasks/`, {
    method: 'GET',
    headers: AUTOMAGIK_HEADERS,
  });

  const data: Task[] = await response.json();
  return data;
}

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
