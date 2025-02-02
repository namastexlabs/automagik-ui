import 'server-only';
import { config } from 'dotenv';
import { zerialize } from 'zodex';

import {
  type InternalToolName,
  internalToolNames,
} from '../agents/tool-declarations/client';
import { INTERNAL_TOOL_MAP } from '../agents/tool-declarations';

config({
  path: '.env.local',
});

const run = async () => {
  if (!process.env.POSTGRES_URL) {
    throw new Error('POSTGRES_URL is not defined');
  }

  // Load queries only after .env is loaded
  const { getInternalTools, updateTool, createTool, deleteToolById } =
    await import('./queries');

  console.log('⏳ Upserting internal tools...');

  let updateCount = 0;
  let createCount = 0;
  let deletedCount = 0;
  const start = Date.now();
  const tools = await getInternalTools();

  for (const createdTool of tools) {
    if (!internalToolNames.includes(createdTool.name)) {
      await deleteToolById({ id: createdTool.id });
      deletedCount++;
    }
  }
  for (const toolName of internalToolNames) {
    const tool = tools.find((t) => t.name === toolName);
    const internalTool = INTERNAL_TOOL_MAP[toolName as InternalToolName];

    const data = {
      name: toolName,
      verboseName: internalTool.verboseName,
      description: internalTool.description,
      parameters: zerialize(internalTool.parameters),
      source: 'internal',
      data: {},
    } as const;

    if (tool) {
      await updateTool({
        id: tool.id,
        ...data,
      });
      updateCount++;
    } else {
      await createTool(data);
      createCount++;
    }
  }
  const end = Date.now();

  console.log(
    `✅ Updated ${updateCount}, Deleted ${deletedCount}, and Created ${createCount} internal tools in ${end - start}ms`,
  );
  process.exit(0);
};

run().catch((err) => {
  console.error('❌ Internal tools generation failed');
  console.error(err);
  process.exit(1);
});
