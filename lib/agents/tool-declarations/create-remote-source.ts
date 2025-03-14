import 'server-only';
import { z } from 'zod';

import { createToolDefinition } from '../tool-declaration';
import { createRemoteSource } from '../../services/automagik';
import { InternalToolName } from './client';

export const createRemoteSourceTool = createToolDefinition({
  name: InternalToolName.createRemoteSource,
  verboseName: 'Create Remote Source',
  description: 'Create a new remote source for Automagik',
  visibility: 'public',
  namedRefinements: undefined,
  parameters: z.object({
    url: z.string().url(),
    apiKey: z.string(),
  }),
  execute: async ({ url, apiKey }, context) => {
    try {
      const source = await createRemoteSource({
        url,
        api_key: apiKey,
        source_type: 'langflow',
        status: 'activate',
      }, context.abortSignal);

      return { data: source, error: null };
    } catch (error) {
      console.error(error);
      return { data: null, error: 'Error creating remote source' };
    }
  },
});
