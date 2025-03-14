import 'server-only';
import { z } from 'zod';

import { validateUUID } from '@/lib/utils';
import { deleteRemoteSource } from '@/lib/services/automagik';

import { createToolDefinition } from '../tool-declaration';
import { InternalToolName } from './client';

const namedRefinements = {
  validateUUID: (id: string, ctx: z.RefinementCtx) => {
    if (!validateUUID(id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalid UUID',
      });
    }
  },
};

export const deleteRemoteSourceTool = createToolDefinition({
  name: InternalToolName.deleteRemoteSource,
  verboseName: 'Delete Remote Source',
  description: 'Delete a remote source by ID',
  visibility: 'public',
  namedRefinements,
  parameters: z.object({
    remoteSourceId: z
      .string()
      .superRefine(namedRefinements.validateUUID)
      .describe('The ID of the remote source to delete'),
  }),
  execute: async ({ remoteSourceId }, context) => {
    try {
      await deleteRemoteSource(remoteSourceId, context.abortSignal);
      return {
        data: { message: 'Remote source deleted successfully' },
        error: null,
      };
    } catch (error) {
      console.error(error);
      return { data: null, error: 'Error deleting remote source' };
    }
  },
});
