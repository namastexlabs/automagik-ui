import 'server-only';
import { and, eq, inArray, isNull, notExists } from 'drizzle-orm';

import { db, schema } from './index';

export async function getAllDynamicBlocksByName(
  names: string[],
  visibility?: 'public' | 'private',
  userId?: string,
) {
  const query = db.query.dynamicBlock.findMany({
    where: (dynamicBlock, { inArray, and, eq }) => {
      const queries = [inArray(dynamicBlock.name, names)];
      if (visibility !== undefined) {
        queries.push(eq(dynamicBlock.visibility, visibility));
      }
      if (userId) {
        queries.push(eq(dynamicBlock.userId, userId));
      }

      return and(...queries);
    },
  });
  try {
    return await query;
  } catch (error) {
    console.error('Failed to get dynamic blocks in database');
    throw error;
  }
}

export async function createAllDynamicBlocks(
  data: {
    name: string;
    userId: string;
    visibility: 'private' | 'public';
  }[],
) {
  try {
    return await db.insert(schema.dynamicBlock).values(data).returning();
  } catch (error) {
    console.error('Failed to create dynamic block in database');
    throw error;
  }
}

export async function deleteAllDynamicBlocksHanging(dynamicBlockIds: string[]) {
  try {
    const { agentsToDynamicBlocks, dynamicBlock } = schema;
    return db
      .delete(schema.dynamicBlock)
      .where(
        and(
          inArray(dynamicBlock.id, dynamicBlockIds),
          isNull(dynamicBlock.content),
          notExists(
            db
              .select()
              .from(agentsToDynamicBlocks)
              .where(eq(agentsToDynamicBlocks.dynamicBlockId, dynamicBlock.id)),
          ),
        ),
      );
  } catch (error) {
    console.error('Failed to check agent to dynamic block in database');
    throw error;
  }
}

export function deleteAllDynamicBlocks(ids: string[]) {
  try {
    return db
      .delete(schema.dynamicBlock)
      .where(and(inArray(schema.dynamicBlock.id, ids)));
  } catch (error) {
    console.error('Failed to delete dynamic block in database');
    throw error;
  }
}

export async function updateDynamicBlock({
  id,
  content,
}: {
  id: string;
  content: string;
}) {
  try {
    return await db
      .update(schema.dynamicBlock)
      .set({ content })
      .where(
        and(
          eq(schema.dynamicBlock.id, id),
        ),
      );
  } catch (error) {
    console.error('Failed to update dynamic block in database');
    throw error;
  }
} 