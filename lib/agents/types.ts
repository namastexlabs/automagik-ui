import type { CoreToolCall, CoreToolResult, DataStreamWriter } from 'ai';
import type { z } from 'zod';

import type { AgentData } from '@/lib/db/queries';
import type { Document } from '@/lib/db/schema';

export type ToolRequestContext = {
  dataStream: DataStreamWriter;
  userId: string;
  agent: AgentData;
};

export type ToolDefinition<N extends string, R, P extends z.ZodTypeAny> = {
  name: N;
  verboseName: string;
  description: string;
  dynamicDescription?: (context: ToolRequestContext) => string;
  parameters: P;
  execute: (params: z.infer<P>, context: ToolRequestContext) => Promise<R>;
};

export type ToolInvocation<
  NAME extends string,
  TOOL,
> = TOOL extends ToolDefinition<NAME, infer RESULT, infer ARGS>
  ?
    | ({
        state: 'partial-call' | 'call';
      } & CoreToolCall<NAME, z.infer<ARGS>>)
    | ({
        state: 'result';
      } & CoreToolResult<NAME, z.infer<ARGS>, RESULT>)
  :
    | ({
        state: 'call' | 'partial-call';
      } & CoreToolCall<NAME, never>)
    | ({
        state: 'result';
      } & CoreToolResult<NAME, never, never>);

export type Source = 'internal' | 'automagik';

type FlowToolData = {
  flowId: string;
};

export type ToolData<source extends Source = Source> = source extends 'automagik'
  ? FlowToolData
  : source extends 'internal'
  ? object
  : never;

export type DocumentExecuteReturn =
  | {
      id: string;
      title: string;
      kind: Document['kind'];
      content?: string;
      message?: string;
    }
  | {
      error: string;
    };

export type WeatherAtLocation = {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  current_units: {
    time: string;
    interval: string;
    temperature_2m: string;
  };
  current: {
    time: string;
    interval: number;
    temperature_2m: number;
  };
  hourly_units: {
    time: string;
    temperature_2m: string;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
  };
  daily_units: {
    time: string;
    sunrise: string;
    sunset: string;
  };
  daily: {
    time: string[];
    sunrise: string[];
    sunset: string[];
  };
};

export type ExecutionResult = {
  result: string | null;
  content: string;
};

type FlowNode = {
  data: {
    description: string;
    id: string;
    node: {
      template: Record<
        string,
        {
          display_name: string;
          fileTypes: string[];
          file_path: string;
          info: string;
          list: boolean;
          name: string;
          required: boolean;
          type: string;
          value: string;
        }
      >;
    };
    type: string;
  };
  id: string;
};

type FlowEdge = {
  source: string;
  target: string;
  data: {
    targetHandle: {
      fieldName: string;
      id: string;
      inputTypes: string[];
      type: string;
    };
    sourceHandle: {
      dataType: string;
      id: string;
      name: string;
      output_types: string[];
    };
  };
};

export type FlowData = {
  name: string;
  description: string;
  source: 'automagik';
  input_component: string;
  output_component: string;
  data: {
    nodes: FlowNode[];
    edges: FlowEdge[];
  };
  id: string;
  created_at: string;
  updated_at: string;
};
