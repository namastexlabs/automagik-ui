import 'server-only';
import { z } from 'zod';
import dedent from 'dedent';

import {
  getAllDynamicBlocksByName,
  updateDynamicBlock,
} from '@/lib/db/queries';

import { createToolDefinition } from '../tool-declaration';
import { InternalToolName } from './client';

export const saveMemoriesTool = createToolDefinition({
  name: InternalToolName.saveMemories,
  verboseName: 'Save Memories',
  description: 'Insert or update memories from the user',
  dynamicDescription: (context) => {
    let options = 'None';
    if (context.agent.dynamicBlocks.length > 0) {
      options = context.agent.dynamicBlocks.map(({ name }) => name).join('\n');
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
  execute: async ({ memories }) => {
    const dynamicBlocks = await getAllDynamicBlocksByName(
      memories.map(({ name }) => name),
    );

    const result: { name: string; content: string }[] = [];
    for (const { name, agentId } of dynamicBlocks) {
      const memory = memories.find((m) => m.name === name);
      if (!memory) {
        continue;
      }

      await updateDynamicBlock({
        agentId,
        name,
        content: memory.content,
      });

      result.push({ name, content: memory.content });
    }

    return { result, content: 'Memory Updated' };
  },
});
