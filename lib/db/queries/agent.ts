import 'server-only';
import { and, eq, inArray } from 'drizzle-orm';

import * as schema from '../schema';
import { db } from './index';

const AGENT_RELATION_QUERY = {
  dynamicBlocks: {
    columns: {},
    with: {
      dynamicBlock: true,
    },
  },
  tools: {
    columns: {},
    with: {
      tool: true,
    },
  },
} as const;

export async function getDefaultAgents() {
  try {
    return await db.query.agent.findMany({
      where: (agent, { isNull }) => isNull(agent.userId),
      with: AGENT_RELATION_QUERY,
    });
  } catch (error) {
    console.error('Failed to get agents in database');
    throw error;
  }
}

export async function getAvailableAgents({ userId }: { userId: string }) {
  try {
    return await db.query.agent.findMany({
      where: (agent, { eq, or }) =>
        or(eq(agent.userId, userId), eq(agent.visibility, 'public')),
      orderBy: (agent, { asc }) => [asc(agent.createdAt)],
      with: AGENT_RELATION_QUERY,
    });
  } catch (error) {
    console.error('Failed to get agents in database');
    throw error;
  }
}

export type AgentData = Awaited<ReturnType<typeof getAvailableAgents>>[number];

export async function getAgentById({
  id,
}: { id: string }): Promise<AgentData | undefined> {
  try {
    return await db.query.agent.findFirst({
      where: (agent, { eq }) => eq(agent.id, id),
      with: AGENT_RELATION_QUERY,
    });
  } catch (error) {
    console.error('Failed to get agents in database');
    throw error;
  }
}

export async function getAgentByNameAndUserId({
  name,
  userId,
  visibility,
}: {
  name: string;
  userId: string;
  visibility: 'private' | 'public';
}) {
  try {
    return await db.query.agent.findFirst({
      where: (agent, { and, eq }) =>
        and(
          eq(agent.name, name),
          eq(agent.userId, userId),
          eq(agent.visibility, visibility),
        ),
    });
  } catch (error) {
    console.error('Failed to get agent in database');
    throw error;
  }
}

export async function createAgent(data: {
  name: string;
  systemPrompt: string;
  userId: string | null;
  visibility?: 'private' | 'public';
}) {
  try {
    const [createdAgent] = await db
      .insert(schema.agent)
      .values(data)
      .returning();

    return createdAgent;
  } catch (error) {
    console.error(`Failed to create agent ${data.name} in database`);
    throw error;
  }
}

export async function updateAgent({
  id,
  ...data
}: {
  id: string;
  name?: string;
  systemPrompt?: string;
  visibility?: 'private' | 'public';
}) {
  try {
    const [updatedAgent] = await db
      .update(schema.agent)
      .set(data)
      .where(eq(schema.agent.id, id))
      .returning();

    return updatedAgent;
  } catch (error) {
    console.error(`Failed to update agent ${id} in database`);
    throw error;
  }
}

export async function deleteAgentById({ id }: { id: string }) {
  try {
    return await db.delete(schema.agent).where(eq(schema.agent.id, id));
  } catch (error) {
    console.error(`Failed to delete agent ${id} in database`);
    throw error;
  }
}

export async function createAllAgentToDynamicBlocks(
  data: {
    agentId: string;
    dynamicBlockId: string;
  }[],
) {
  try {
    return await db
      .insert(schema.agentsToDynamicBlocks)
      .values(data)
      .returning();
  } catch (error) {
    console.error('Failed to create agent to dynamic block in database');
    throw error;
  }
}

export async function deleteAllAgentToDynamicBlocks(
  agentId: string,
  dynamicBlockIds: string[],
) {
  try {
    return await db
      .delete(schema.agentsToDynamicBlocks)
      .where(
        and(
          eq(schema.agentsToDynamicBlocks.agentId, agentId),
          inArray(schema.agentsToDynamicBlocks.dynamicBlockId, dynamicBlockIds),
        ),
      );
  } catch (error) {
    console.error('Failed to delete agent to dynamic block in database');
    throw error;
  }
}

export async function createAllAgentToTools(
  data: {
    agentId: string;
    toolId: string;
  }[],
) {
  try {
    return await db.insert(schema.agentsToTools).values(data).returning();
  } catch (error) {
    console.error(`Failed to create agent to tool in database`);
    throw error;
  }
}

export async function deleteAllAgentToTools(
  agentId: string,
  toolIds: string[],
) {
  try {
    return await db
      .delete(schema.agentsToTools)
      .where(
        and(
          eq(schema.agentsToTools.agentId, agentId),
          inArray(schema.agentsToTools.toolId, toolIds),
        ),
      );
  } catch (error) {
    console.error(`Failed to delete agent to tools in database`);
    throw error;
  }
}

export async function createAgentTransaction(data: {
  name: string;
  systemPrompt: string;
  userId: string | null;
  visibility?: 'private' | 'public';
  tools?: string[];
  dynamicBlocks?: string[];
}) {
  return await db.transaction(async () => {
    const agent = await createAgent({
      name: data.name,
      systemPrompt: data.systemPrompt,
      userId: data.userId,
      visibility: data.visibility,
    });

    if (data.tools && data.tools.length > 0) {
      await createAllAgentToTools(
        data.tools.map((tool) => ({
          agentId: agent.id,
          toolId: tool,
        })),
      );
    }

    if (data.dynamicBlocks && data.dynamicBlocks.length > 0) {
      await createAllAgentToDynamicBlocks(
        data.dynamicBlocks.map((block) => ({
          agentId: agent.id,
          dynamicBlockId: block,
        })),
      );
    }

    return agent;
  });
}

export async function updateAgentTransaction(data: {
  id: string;
  name?: string;
  systemPrompt?: string;
  visibility?: 'private' | 'public';
  newTools?: string[];
  newDynamicBlocks?: string[];
  removedTools?: string[];
  removedDynamicBlocks?: string[];
}) {
  return await db.transaction(async () => {
    await updateAgent(data);
    if (data.removedDynamicBlocks && data.removedDynamicBlocks.length > 0) {
      await deleteAllAgentToDynamicBlocks(data.id, data.removedDynamicBlocks);
    }
    if (data.removedTools && data.removedTools.length > 0) {
      await deleteAllAgentToTools(data.id, data.removedTools);
    }
    if (data.newDynamicBlocks && data.newDynamicBlocks.length > 0) {
      await createAllAgentToDynamicBlocks(
        data.newDynamicBlocks.map((block) => ({
          agentId: data.id,
          dynamicBlockId: block,
        })),
      );
    }
    if (data.newTools && data.newTools.length > 0) {
      await createAllAgentToTools(
        data.newTools.map((tool) => ({
          agentId: data.id,
          toolId: tool,
        })),
      );
    }
  });
}
