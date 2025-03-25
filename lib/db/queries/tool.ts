import 'server-only';
import { and, eq } from 'drizzle-orm';
import type { SzObject } from 'zodex';

import type { Source, ToolData } from '@/lib/agents/types';

import * as schema from '../schema';
import { db } from './index';

export async function getToolById({ id }: { id: string }) {
  try {
    return await db.query.tool.findFirst({
      where: (tool, { eq }) => eq(tool.id, id),
    });
  } catch (error) {
    console.error('Failed to get tool in database');
    throw error;
  }
}

export async function getInternalTools() {
  try {
    return await db.query.tool.findMany({
      where: (tool, { eq }) => eq(tool.source, 'internal'),
    });
  } catch (error) {
    console.error('Failed to get internal tools in database');
    throw error;
  }
}

export async function getAvailableTools(userId: string) {
  try {
    return await db.query.tool.findMany({
      where: (tool, { eq, or }) =>
        or(eq(tool.userId, userId), eq(tool.visibility, 'public')),
    });
  } catch (error) {
    console.error('Failed to get tools in database');
    throw error;
  }
}

export async function getAllToolsById(ids: string[], userId: string) {
  try {
    return await db.query.tool.findMany({
      where: (tool, { inArray, eq, or }) =>
        and(
          inArray(tool.id, ids),
          or(eq(tool.userId, userId), eq(tool.visibility, 'public')),
        ),
    });
  } catch (error) {
    console.error('Failed to get tools in database');
    throw error;
  }
}

export async function createTool<T extends Source>(data: {
  name: string;
  verboseName: string;
  description: string;
  data: ToolData<T>;
  parameters?: SzObject;
  source: T;
  userId?: string | null;
  visibility?: 'private' | 'public';
}) {
  try {
    const [createdTool] = await db.insert(schema.tool).values(data).returning();

    return createdTool;
  } catch (error) {
    console.error(`Failed to create tool ${data.name} in database`);
    throw error;
  }
}

export async function updateTool<T extends Source>({
  id,
  ...data
}: {
  id: string;
  data?: ToolData<T>;
  source?: T;
  name?: string;
  verboseName?: string;
  description?: string;
  parameters?: SzObject;
  visibility?: 'private' | 'public';
}) {
  try {
    const [updatedTool] = await db
      .update(schema.tool)
      .set(data)
      .where(eq(schema.tool.id, id))
      .returning();

    return updatedTool;
  } catch (error) {
    console.error(`Failed to update tool ${id} in database`);
    throw error;
  }
}

export async function deleteToolById({ id }: { id: string }) {
  try {
    return await db.delete(schema.tool).where(eq(schema.tool.id, id));
  } catch (error) {
    console.error(`Failed to delete tool ${id} in database`);
    throw error;
  }
}
