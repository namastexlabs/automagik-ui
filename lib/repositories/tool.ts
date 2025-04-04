import 'server-only';
import { zerialize } from 'zodex';

import {
  getToolById,
  createTool,
  updateTool,
  getAllToolsById,
  getAvailableTools,
} from '@/lib/db/queries/tool';
import type { Tool } from '@/lib/db/schema';
import { isUniqueConstraintError } from '@/lib/db/queries';
import { ConflictError, NotFoundError, UnauthorizedError } from '@/lib/errors';
import { createChatFlowTool, normalizeVerboseName } from '@/lib/agents/tool';

export async function createFlowTool({
  userId,
  flowId,
  verboseName,
  description,
  visibility,
}: {
  userId: string;
  flowId: string;
  verboseName: string;
  description: string;
  visibility?: 'private' | 'public';
}): Promise<Tool> {
  try {
    const name = normalizeVerboseName(verboseName);

    const {
      name: toolName,
      verboseName: toolVerboseName,
      description: toolDescription,
      parameters,
    } = createChatFlowTool(flowId, { name, verboseName, description });

    const tool = await createTool({
      source: 'automagik',
      name: toolName,
      verboseName: toolVerboseName,
      description: toolDescription,
      parameters: parameters && zerialize(parameters),
      data: { flowId },
      userId,
      visibility,
    });

    return tool;
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      const message = `A ${visibility} tool with this name already exists`;
      throw new ConflictError(message, { name: [message] });
    }
    throw error;
  }
}

export async function updateFlowTool({
  id,
  userId,
  flowId,
  verboseName,
  description,
  visibility,
}: {
  id: string;
  userId: string;
  flowId: string;
  verboseName: string;
  description: string;
  visibility?: 'private' | 'public';
}): Promise<Tool> {
  try {
    const flowTool = await getToolById({ id });
    if (!flowTool) {
      throw new NotFoundError('Tool not found');
    }
    if (flowTool.userId !== userId || flowTool.source === 'internal') {
      throw new UnauthorizedError('Not authorized to update this tool');
    }

    const name = normalizeVerboseName(flowTool.name);
    const {
      name: toolName,
      verboseName: toolVerboseName,
      description: toolDescription,
      parameters,
    } = createChatFlowTool(flowId, { name, verboseName, description });

    const tool = await updateTool({
      id,
      source: 'automagik',
      name: toolName,
      verboseName: toolVerboseName,
      description: toolDescription,
      parameters: parameters && zerialize(parameters),
      data: { flowId },
      visibility,
    });

    return tool;
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      const message = `A ${visibility} tool with this name already exists`;
      throw new ConflictError(message, { name: [message] });
    }
    throw error;
  }
}

export async function getUserAvailableTools(userId: string): Promise<Tool[]> {
  return await getAvailableTools(userId);
}

export async function getToolsByIds(
  ids: string[],
  userId: string,
): Promise<Tool[]> {
  return await getAllToolsById(ids, userId);
}
