import type { StreamData } from 'ai';
import type { z } from 'zod';

import type { Model } from '@/lib/ai/models';
import type { AgentData } from '../db/queries';

export type ToolRequestContext = {
  streamingData: StreamData;
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
