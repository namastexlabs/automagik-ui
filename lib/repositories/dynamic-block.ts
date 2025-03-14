import 'server-only';

import type { DynamicBlock } from '@/lib/db/schema';
import {
  getAllDynamicBlocksByName,
  updateDynamicBlock,
  createAllDynamicBlocks,
  deleteAllDynamicBlocksHanging,
} from '@/lib/db/queries/dynamic-block';
import type { AgentData } from '@/lib/db/queries/agent';

export async function getOrCreateDynamicBlocks(
  userId: string,
  blocks: Array<{ name: string; visibility: 'private' | 'public' }>,
): Promise<DynamicBlock[]> {
  const existingBlocks = await getAllDynamicBlocksByName(
    blocks.reduce((acc, { name, visibility }) => {
      if (visibility === 'public') {
        acc.push(name);
      }
      return acc;
    }, [] as string[]),
    'public',
  );

  const privateBlocks = await getAllDynamicBlocksByName(
    blocks.reduce((acc, { name, visibility }) => {
      if (visibility === 'private') {
        acc.push(name);
      }
      return acc;
    }, [] as string[]),
    'private',
    userId,
  );

  const allBlocks = [...existingBlocks, ...privateBlocks];
  const missingBlocks = blocks.filter(
    ({ name }) => !allBlocks.find((block) => block.name === name),
  );

  if (missingBlocks.length > 0) {
    const newBlocks = await createAllDynamicBlocks(
      missingBlocks.map((block) => ({ ...block, userId })),
    );
    return [...allBlocks, ...newBlocks];
  }

  return allBlocks;
}

export async function updateMemories(
  memories: Array<{ name: string; content: string }>,
  agent: AgentData,
): Promise<Array<{ name: string }>> {
  return await Promise.all(
    memories.map(async ({ name, content }) => {
      const item = agent.dynamicBlocks.find(({ dynamicBlock }) => dynamicBlock.name === name);
      if (!item) {
        return { name };
      }

      await updateDynamicBlock({
        id: item.dynamicBlock.id,
        content,
      });

      return { name };
    }),
  );
}

export async function removeUnusedDynamicBlocks(
  blockIds: string[],
): Promise<void> {
  await deleteAllDynamicBlocksHanging(blockIds);
}
