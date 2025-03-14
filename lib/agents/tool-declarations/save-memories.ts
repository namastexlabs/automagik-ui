import 'server-only';
import { z } from 'zod';
import dedent from 'dedent';

import { createToolDefinition } from '../tool-declaration';
import { InternalToolName } from './client';
import { updateMemories } from '@/lib/repositories/dynamic-block';

export const saveMemoriesTool = createToolDefinition({
  name: InternalToolName.saveMemories,
  verboseName: 'Save Memories',
  description: 'Insert or update memories from the user',
  visibility: 'public',
  namedRefinements: undefined,
  dynamicDescription: (context) => {
    let options = 'None';
    if (context.agent.dynamicBlocks.length > 0) {
      options = context.agent.dynamicBlocks
        .map(({ dynamicBlock }) => dynamicBlock.name)
        .join('\n');
    }

    return dedent`
      You ONLY use the following memory names:
      ${options}
    `;
  },
  parameters: z.object({
    memories: z.array(
      z.object({ name: z.string().trim(), content: z.string().trim() }),
    ),
  }),
  execute: async ({ memories }, context) => {
    if (context.abortSignal.aborted) {
      const result = await updateMemories(memories, context.agent);
      return { result, content: 'Memory Updated' };
    }
  },
});
