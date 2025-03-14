import type { ToolCall, ToolResult, DataStreamWriter, Message } from 'ai';
import type { z } from 'zod';

import type { Document, Chat } from '@/lib/db/schema';
import type { AgentData } from '../db/queries/agent';

export type InferParameters<T> = T extends z.ZodTypeAny
  ? z.infer<T>
  : undefined;

export type ToolRequestContext = {
  dataStream: DataStreamWriter;
  userId: string;
  userMessage: Message;
  agent: AgentData;
  chat: Chat;
  abortSignal: AbortSignal;
};

export type ToolDefinition<
  NAME extends string,
  RESULT,
  PARAMETERS,
  REFINEMENTS extends
    | Record<string, (value: any, ctx: z.RefinementCtx) => any>
    | undefined = undefined,
> = {
  name: NAME;
  verboseName: string;
  description: string;
  visibility: 'public' | 'private';
  namedRefinements: REFINEMENTS;
  dynamicDescription?: (context: ToolRequestContext) => string;
  parameters: PARAMETERS;
  execute: PARAMETERS extends z.ZodTypeAny
    ? (
        params: InferParameters<PARAMETERS>,
        context: ToolRequestContext,
      ) => Promise<RESULT>
    : (context: ToolRequestContext) => Promise<RESULT>;
};

export type ToolInvocation<
  NAME extends string,
  TOOL,
> = TOOL extends ToolDefinition<
  NAME,
  infer RESULT,
  infer PARAMETERS,
  infer NAMED_REFINEMENTS
>
  ?
      | ({
          state: 'partial-call' | 'call';
        } & ToolCall<NAME, InferParameters<PARAMETERS>>)
      | ({
          state: 'result';
        } & ToolResult<NAME, InferParameters<PARAMETERS>, RESULT>)
  :
      | ({
          state: 'call' | 'partial-call';
        } & ToolCall<NAME, never>)
      | ({
          state: 'result';
        } & ToolResult<NAME, never, never>);

export type Source = 'internal' | 'automagik';

type FlowToolData = {
  flowId: string;
};

export type ToolData<source extends Source = Source> =
  source extends 'automagik'
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
      error: null;
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
