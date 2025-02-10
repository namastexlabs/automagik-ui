import 'server-only';
import {
  createAllDynamicBlocks,
  getAllDynamicBlocksByName,
} from '../db/queries';
import { getDiffRelation, getDynamicBlockNames } from '../utils';

export function insertDynamicBlocksIntoPrompt(
  prompt: string,
  blocks: { name: string; content: string | null }[],
) {
  return blocks.reduce(
    (acc, block) => acc.replace(`{{${block.name}}}`, block.content || 'BLANK'),
    prompt,
  );
}

export async function getOrCreateAllDynamicBlocks(
  userId: string,
  formDynamicBlocks: {
    name: string;
    visibility: 'private' | 'public';
  }[],
) {
  const globalDynamicBlocks = await getAllDynamicBlocksByName(
    getDynamicBlockNames(true, formDynamicBlocks),
    true,
  );

  const localDynamicBlocks = await getAllDynamicBlocksByName(
    getDynamicBlockNames(false, formDynamicBlocks),
    false,
    userId,
  );

  const dynamicBlocks = [...globalDynamicBlocks, ...localDynamicBlocks];
  const [, dynamicBlocksToCreate] = getDiffRelation(
    dynamicBlocks,
    formDynamicBlocks,
    (a, b) => a.name === b.name,
  );
  if (dynamicBlocksToCreate.length > 0) {
    const createdDynamicBlocks = await createAllDynamicBlocks(
      dynamicBlocksToCreate.map((block) => ({ ...block, userId })),
    );

    dynamicBlocks.push(...createdDynamicBlocks);
  }

  return dynamicBlocks;
}
