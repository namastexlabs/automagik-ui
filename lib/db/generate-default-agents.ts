import 'server-only';
import { config } from 'dotenv';
import { getDiffRelation } from '@/lib/utils';

config({
  path: '.env.local',
});

const run = async () => {
  if (!process.env.POSTGRES_URL) {
    throw new Error('POSTGRES_URL is not defined');
  }

  // Load queries only after .env is loaded
  const {
    getDefaultAgents,
    createAgent,
    updateAgent,
    deleteAgentById,
    getInternalTools,
    createAllAgentToTools,
    deleteAllAgentToTools,
  } = await import('./queries');

  const automagikAgent = await import('@/lib/agents/default-agents/automagik');

  const defaultAgents = [
    automagikAgent,
  ]

  console.log('⏳ Upserting default agents...');

  let updateCount = 0;
  let createCount = 0;
  let deletedCount = 0;
  const start = Date.now();
  const agents = await getDefaultAgents();
  const internalTools = await getInternalTools();

  if (internalTools.length === 0) {
    throw new Error('No internal tools found, run db:update-tools');
  }

  for (const createdAgent of agents) {
    if (!defaultAgents.some((agent) => agent.name === createdAgent.name)) {
      await deleteAgentById({ id: createdAgent.id });
      deletedCount++;
    }
  }

  for (const agent of defaultAgents) {
    const createdAgent = agents.find((a) => a.name === agent.name);

    const agentTools = agent.tools.map((tool) => {
      const internalTool = internalTools.find((t) => t.name === tool);
      if (!internalTool) {
        throw new Error(`Tool ${tool} not found in database`);
      }

      return internalTool;
    });

    const data = {
      name: agent.name,
      systemPrompt: agent.systemPrompt,
      visibility: 'public',
      userId: null,
    } as const;

    if (createdAgent) {
      await updateAgent({
        id: createdAgent.id,
        ...data,
      });

      const currentAgentTools = createdAgent.tools.map(({ tool }) => tool) || [];
      const [deletedTools, newTools] = getDiffRelation(
        currentAgentTools,
        agentTools,
        (a, b) => a.id === b.id,
      );

      if (newTools.length > 0) {
        await createAllAgentToTools(
          newTools.map((tool) => ({
            agentId: createdAgent.id,
            toolId: tool.id,
          })),
        );
      }
      if (deletedTools.length > 0) {
        await deleteAllAgentToTools(createdAgent.id, deletedTools.map((tool) => tool.id));
      }

      updateCount++;
    } else {
      const newAgent = await createAgent(data);

      await createAllAgentToTools(
        agentTools.map((tool) => ({
          agentId: newAgent.id,
          toolId: tool.id,
        })),
      );

      createCount++;
    }
  }
  const end = Date.now();

  console.log(
    `✅ Updated ${updateCount}, Deleted ${deletedCount}, and Created ${createCount} default agents in ${end - start}ms`,
  );
  process.exit(0);
};

run().catch((err) => {
  console.error('❌ default agents generation failed');
  console.error(err);
  process.exit(1);
});
