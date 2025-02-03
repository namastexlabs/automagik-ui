import type { CoreToolCall, CoreToolResult, DataStreamWriter } from 'ai';
import type { z } from 'zod';

import type { Model } from '@/lib/ai/models';
import type { AgentData } from '@/lib/db/queries';

export type ToolRequestContext = {
  streamingData: DataStreamWriter;
  model: Model;
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

export type Source = 'internal' | 'langflow';

type FlowToolData = {
  flowId: string;
};

export type ToolData<source extends Source = Source> =
  source extends 'langflow' ? FlowToolData
  : source extends 'internal' ? object
  : never;

export type DocumentExecuteReturn =
  | {
      id: string;
      title: string;
      kind: string;
      content: string;
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

export type LangflowResponse = {
  session_id: string;
  outputs: FlowOutput[];
};

type FlowOutput = {
  inputs: {
    input_value: string;
  };
  outputs: {
    results: {
      message: Message;
    };
    artifacts: Artifacts;
    outputs: {
      message: {
        message: Message;
        type: string;
      };
    };
    messages: ChatMessage[];
  }[];
};

type Message = {
  data: {
    text: string;
    sender: string;
    sender_name: string;
    session_id: string;
    timestamp: string;
  };
  text: string;
  sender: string;
  sender_name: string;
  session_id: string;
  timestamp: string;
};

type Artifacts = {
  message: string;
  sender: string;
  sender_name: string;
};

type ChatMessage = {
  message: string;
  sender: string;
  sender_name: string;
  session_id: string;
};
