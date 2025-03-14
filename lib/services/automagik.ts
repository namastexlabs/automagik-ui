import 'server-only';
import type { FlowData, Schedule, Task } from './types';

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

export async function createRemoteSource(
  params: {
    url: string;
    api_key: string;
    source_type: string;
    status: string;
  },
  abortSignal: AbortSignal,
) {
  if (!checkAutomagikCredentials()) {
    return null;
  }

  const response = await fetch(`${AUTOMAGIK_URL}/api/v1/sources/`, {
    method: 'POST',
    headers: AUTOMAGIK_HEADERS,
    body: JSON.stringify(params),
    signal: abortSignal,
  });

  return await response.json();
}

export async function deleteRemoteSource(
  sourceId: string,
  abortSignal: AbortSignal,
) {
  if (!checkAutomagikCredentials()) {
    return null;
  }

  const response = await fetch(`${AUTOMAGIK_URL}/api/v1/sources/${sourceId}/`, {
    method: 'DELETE',
    headers: AUTOMAGIK_HEADERS,
    signal: abortSignal,
  });

  return await response.json();
}

export async function getRemoteSources(abortSignal: AbortSignal) {
  if (!checkAutomagikCredentials()) {
    return [];
  }

  const response = await fetch(`${AUTOMAGIK_URL}/api/v1/sources/`, {
    method: 'GET',
    headers: AUTOMAGIK_HEADERS,
    signal: abortSignal,
  });

  const data = await response.json();
  return data;
}

export async function getRemoteWorkflows(abortSignal: AbortSignal) {
  if (!checkAutomagikCredentials()) {
    return [];
  }

  const response = await fetch(
    `${AUTOMAGIK_URL}/api/v1/workflows/remote?simplified=true`,
    {
      method: 'GET',
      headers: AUTOMAGIK_HEADERS,
      signal: abortSignal,
    },
  );

  const data: FlowData[] = await response.json();
  return data;
}

export async function getWorkflows(abortSignal: AbortSignal) {
  if (!checkAutomagikCredentials()) {
    return [];
  }

  const response = await fetch(`${AUTOMAGIK_URL}/api/v1/workflows/`, {
    method: 'GET',
    headers: AUTOMAGIK_HEADERS,
    signal: abortSignal,
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
  abortSignal: AbortSignal,
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
      signal: abortSignal,
    },
  );

  const data: FlowData = await response.json();
  return data;
}

export async function runWorkflow(
  workflowId: string,
  inputValue: string,
  abortSignal: AbortSignal,
) {
  if (!checkAutomagikCredentials()) {
    return null;
  }

  const response = await fetch(
    `${AUTOMAGIK_URL}/api/v1/workflows/${workflowId}/run/`,
    {
      method: 'POST',
      headers: AUTOMAGIK_HEADERS,
      body: JSON.stringify(inputValue),
      signal: abortSignal,
    },
  );

  const data = await response.json();
  return data;
}

export async function createSchedule(
  params: {
    workflow_id: string;
    input_value: string;
    schedule_type: 'interval' | 'cron';
    schedule_expr: string;
  },
  abortSignal: AbortSignal,
) {
  if (!checkAutomagikCredentials()) {
    console.error('Missing credentials for Automagik');
    return null;
  }

  const response = await fetch(`${AUTOMAGIK_URL}/api/v1/schedules/`, {
    method: 'POST',
    headers: AUTOMAGIK_HEADERS,
    body: JSON.stringify(params),
    signal: abortSignal,
  });

  const data: Schedule = await response.json();
  return data;
}

export async function enableSchedule(
  scheduleId: string,
  abortSignal: AbortSignal,
) {
  if (!checkAutomagikCredentials()) {
    return null;
  }

  const response = await fetch(
    `${AUTOMAGIK_URL}/api/v1/schedules/${scheduleId}/enable/`,
    {
      method: 'POST',
      headers: AUTOMAGIK_HEADERS,
      signal: abortSignal,
    },
  );

  const data: Schedule = await response.json();
  return data;
}

export async function disableSchedule(
  scheduleId: string,
  abortSignal: AbortSignal,
) {
  if (!checkAutomagikCredentials()) {
    return null;
  }

  const response = await fetch(
    `${AUTOMAGIK_URL}/api/v1/schedules/${scheduleId}/disable/`,
    {
      method: 'POST',
      headers: AUTOMAGIK_HEADERS,
      signal: abortSignal,
    },
  );

  const data: Schedule = await response.json();
  return data;
}

export async function deleteSchedule(
  scheduleId: string,
  abortSignal: AbortSignal,
) {
  if (!checkAutomagikCredentials()) {
    return null;
  }

  const response = await fetch(
    `${AUTOMAGIK_URL}/api/v1/schedules/${scheduleId}`,
    {
      method: 'DELETE',
      headers: AUTOMAGIK_HEADERS,
      signal: abortSignal,
    },
  );

  return await response.json();
}

export async function getSchedules(abortSignal: AbortSignal) {
  if (!checkAutomagikCredentials()) {
    return [];
  }

  const response = await fetch(`${AUTOMAGIK_URL}/api/v1/schedules/`, {
    method: 'GET',
    headers: AUTOMAGIK_HEADERS,
    signal: abortSignal,
  });

  const data: Schedule[] = await response.json();
  return data;
}

export async function getTasks(abortSignal: AbortSignal) {
  if (!checkAutomagikCredentials()) {
    return [];
  }

  const response = await fetch(`${AUTOMAGIK_URL}/api/v1/tasks/`, {
    method: 'GET',
    headers: AUTOMAGIK_HEADERS,
    signal: abortSignal,
  });

  const data: Task[] = await response.json();
  return data;
}
