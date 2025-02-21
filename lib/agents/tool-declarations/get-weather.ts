import 'server-only';
import { z } from 'zod';

import type { WeatherAtLocation } from '../types';
import { createToolDefinition } from '../tool-declaration';
import { InternalToolName } from './client';

export const weatherTool = createToolDefinition({
  name: InternalToolName.getWeather,
  verboseName: 'Get Weather',
  description: 'Get the current weather at a location',
  visibility: 'public',
  namedRefinements: undefined,
  parameters: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
  execute: async ({ latitude, longitude }) => {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&hourly=temperature_2m&daily=sunrise,sunset&timezone=auto`,
    );

    const weatherData: WeatherAtLocation = await response.json();
    return weatherData;
  },
});
