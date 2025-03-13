import 'server-only';

import { getRemoteSources } from '@/lib/services/automagik';

import { createToolDefinition } from '../tool-declaration';
import { InternalToolName } from './client';

export const listRemoteSourcesTool = createToolDefinition({
  name: InternalToolName.listRemoteSources,
  verboseName: 'List Remote Sources',
  description: 'List remote sources for Automagik',
  visibility: 'public',
  namedRefinements: undefined,
  parameters: undefined,
  execute: async () => {
    try {
      const sources = await getRemoteSources();

      return { data: sources, error: null };
    } catch (error) {
      console.error(error);
      return { data: null, error: 'Error fetching remote sources' };
    }
  },
});
