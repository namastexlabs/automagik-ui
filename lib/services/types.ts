export type FlowData = {
  name: string;
  description: string;
  source: string;
  is_component: boolean;
  input_component: string;
  output_component: string;
  id: string;
  created_at: string;
  updated_at: string;
  folder_id: string;
  folder_name: string;
  source_id: string;
};

export type FlowPayload = {
  id: string;
  name: string;
  description: string;
  nodes: {
    id: string;
    type: string;
  }[];
};

export type Schedule = {
  flow_id: string;
  schedule_type: string;
  schedule_expr: string;
  // TODO: Discover how to use this
  flow_params: any;
  status: 'paused' | 'active' | 'stopped';
  next_run_at: string;
  id: string;
};

export type Task = {
  flow_id: string;
  // TODO: Discover how to use this
  input_data: any;
  // TODO: Discover how to use this
  output_data: any;
  error: string;
  tries: number;
  max_retries: number;
  next_retry_at: string;
  started_at: string;
  finished_at: string;
  id: string;
  status: string;
};
