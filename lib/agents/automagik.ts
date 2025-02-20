import 'server-only';
import { z } from 'zod';
import { createToolDefinition } from './tool-declaration';
import type { ExecutionResult, FlowData, Schedule, Task } from './types';

const AUTOMAGIK_URL = process.env.AUTOMAGIK_URL || '';
const AUTOMAGIK_API_KEY = process.env.AUTOMAGIK_API_KEY || '';

const checkAutomagikCredentials = () => {
  if (!AUTOMAGIK_URL || !AUTOMAGIK_API_KEY) {
    console.error('Missing credentials for Automagik');
    return false;
  }
  return true;
};

const AUTOMAGIK_HEADERS = {
  'x-api-key': AUTOMAGIK_API_KEY,
  'Content-Type': 'application/json',
  accept: 'application/json',
};

export async function createRemoteSource(params: {
  url: string;
  api_key: string;
  source_type: string;
  status: string;
}) {
  if (!checkAutomagikCredentials()) {
    return null;
  }

  const response = await fetch(`${AUTOMAGIK_URL}/api/v1/sources/`, {
    method: 'POST',
    headers: AUTOMAGIK_HEADERS,
    body: JSON.stringify(params),
  });

  return await response.json();
}

export async function getRemoteSources() {
  if (!checkAutomagikCredentials()) {
    return [];
  }

  const response = await fetch(`${AUTOMAGIK_URL}/api/v1/sources/`, {
    method: 'GET',
    headers: AUTOMAGIK_HEADERS,
  });

  const data: FlowData[] = await response.json();
  return data;
}

export async function getRemoteWorkflows() {
  if (!checkAutomagikCredentials()) {
    return [];
  }

  const response = await fetch(
    `${AUTOMAGIK_URL}/api/v1/workflows/remote?simplified=true`,
    {
      method: 'GET',
      headers: AUTOMAGIK_HEADERS,
    },
  );

  const data: FlowData[] = await response.json();
  return data;
}

export async function getWorkflows() {
  if (!checkAutomagikCredentials()) {
    return [];
  }

  const response = await fetch(`${AUTOMAGIK_URL}/api/v1/workflows/`, {
    method: 'GET',
    headers: AUTOMAGIK_HEADERS,
  });

  const data: FlowData[] = await response.json();
  return data;
}

export async function syncWorkflow(
  remoteFlowId: string,
  params: {
    input_component: string;
    output_component: string;
  },
) {
  if (!checkAutomagikCredentials()) {
    return null;
  }

  const searchParams = new URLSearchParams();

  searchParams.append('input_component', params.input_component);
  searchParams.append('output_component', params.output_component);

  const response = await fetch(
    `${AUTOMAGIK_URL}/api/v1/workflows/sync/${remoteFlowId}?${searchParams.toString()}`,
    {
      method: 'POST',
      headers: AUTOMAGIK_HEADERS,
    },
  );

  const data: FlowData = await response.json();
  return data;
}

export async function createSchedule(params: {
  workflow_id: string;
  input_value: string;
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
