'use server';

import {
  convertToCoreMessages,
  generateText,
  type Message,
  type CoreMessage,
} from 'ai';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { zerialize } from 'zodex';

import { customModel } from '@/lib/ai';
import {
  createAllAgentToTools,
  deleteAgentById,
  deleteChatById,
  deleteMessagesByChatIdAfterTimestamp,
  getAgentById,
  getAllToolsById,
  getChatById,
  getMessageById,
  createAgent,
  saveChat,
  updateChatVisiblityById,
  updateAgent,
  deleteAllAgentToTools,
  getToolById,
  createTool,
  updateTool,
  createAllAgentToDynamicBlocks,
  deleteAllAgentToDynamicBlocks,
  deleteAllDynamicBlocksHanging,
} from '@/lib/db/queries';
import { getOrCreateAllDynamicBlocks } from '@/lib/agents/dynamic-blocks.server';
import type { VisibilityType } from '@/components/visibility-selector';
import { auth } from '@/app/(auth)/auth';
import type { Agent, Chat, Tool } from '@/lib/db/schema';
import { notFound } from 'next/navigation';
import {
  generateUUID,
  getDiffRelation,
  getMostRecentUserMessage,
} from '@/lib/utils';
import { mapAgent, mapTool, type ClientAgent } from '@/lib/data';
import type { ActionStateData, ActionStateStatus } from '@/app/types';
import { createChatFlowTool } from '@/lib/agents/langflow';

const agentFormSchema = z.object({
  name: z.string().trim(),
  systemPrompt: z.string(),
  tools: z.array(z.string()).default([]),
  dynamicBlocks: z
    .array(
      z.object({
        name: z.string().trim(),
        global: z.boolean(),
      }),
    )
    .refine(
      (items) => new Set(items.map((item) => item.name)).size === items.length,
      { message: 'Dynamic block names must be unique' },
    )
    .default([]),
});

const flowToolSchema = z.object({
  name: z.string().trim(),
  verboseName: z.string().trim(),
  description: z.string(),
  flowId: z.string().trim(),
});

export async function saveModelId(model: string) {
  const cookieStore = await cookies();
  cookieStore.set('model-id', model);
}

export async function generateTitleFromUserMessage({
  message,
}: {
  message: CoreMessage;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    return notFound();
  }

  const { text: title } = await generateText({
    model: customModel('gpt-4o-mini'),
    system: `\n
    - you will generate a short title based on the first message a user begins a conversation with
    - ensure it is not more than 80 characters long
    - the title should be a summary of the user's message
    - do not use quotes or colons`,
    prompt: JSON.stringify(message),
  });

  return title;
}

export async function deleteTrailingMessages({ id }: { id: string }) {
  const session = await auth();
  const message = await getMessageById({ id });

  if (!message) {
    return notFound();
  }

  if (!session?.user?.id || message.chat.userId !== session?.user?.id) {
    return notFound();
  }

  await deleteMessagesByChatIdAfterTimestamp({
    chatId: message.chatId,
    timestamp: message.createdAt,
  });
}

export async function updateChatVisibility({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: VisibilityType;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    return notFound();
  }

  const chat = await getChatById({ id: chatId });

  if (chat?.userId !== session.user.id) {
    return notFound();
  }

  await updateChatVisiblityById({ chatId, visibility });
}

export async function createChat({
  agentId,
  messages,
}: {
  agentId: string;
  messages: Message[];
}): Promise<{ status: 'failed' | 'success'; data?: Chat }> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return notFound();
    }

    const coreMessages = convertToCoreMessages(messages);
    const userMessage = getMostRecentUserMessage(coreMessages);

    if (!userMessage) {
      return { status: 'failed' };
    }

    const chat = await saveChat({
      id: generateUUID(),
      userId: session.user.id,
      agentId: agentId,
      title: await generateTitleFromUserMessage({ message: userMessage }),
    });

    return { status: 'success', data: chat };
  } catch (error) {
    console.error('Failed to create chat', error);
    return { status: 'failed' };
  }
}

export async function deleteChat({ id }: { id: string }): Promise<{
  status: Exclude<
    ActionStateStatus['status'],
    'idle' | 'in_progress' | 'invalid_data'
  >;
}> {
  const session = await auth();
  const chat = await getChatById({ id });

  if (!session?.user?.id || chat?.userId !== session.user.id) {
    return notFound();
  }

  try {
    await deleteChatById({ id });
    return { status: 'success' };
  } catch (error) {
    console.error('Failed to delete chat', error);
    return { status: 'failed' };
  }
}

export async function saveAgent(
  _: ActionStateData<ClientAgent>,
  formData: FormData,
): Promise<ActionStateData<ClientAgent>> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { status: 'failed', data: null };
    }

    const validatedData = agentFormSchema.parse({
      name: formData.get('name'),
      systemPrompt: formData.get('systemPrompt'),
      tools: formData.getAll('tools'),
      dynamicBlocks: formData
        .getAll('dynamicBlocks')
        .map((item) => JSON.parse(item as string)),
    });

    const formTools = await getAllToolsById(validatedData.tools);
    const dynamicBlocks = await getOrCreateAllDynamicBlocks(
      session.user.id,
      validatedData.dynamicBlocks,
    );

    let agent: Agent;
    const id = formData.get('id') as string;
    if (id) {
      const prevAgent = await getAgentById({ id });

      if (prevAgent?.userId !== session.user.id) {
        return { status: 'failed', data: null };
      }

      agent = await updateAgent({
        id,
        name: validatedData.name,
        systemPrompt: validatedData.systemPrompt,
      });

      const [deletedTools, newTools] = getDiffRelation(
        prevAgent.tools.map((tool) => tool.tool),
        formTools,
        (a, b) => a.id === b.id,
      );
      const [deletedDynamicBlocks, newDynamicBlocks] = getDiffRelation(
        prevAgent.dynamicBlocks.map(({ dynamicBlock }) => dynamicBlock),
        dynamicBlocks,
        (a, b) => a.id === b.id,
      );

      if (newTools.length > 0) {
        await createAllAgentToTools(
          newTools.map((tool) => ({ agentId: id, toolId: tool.id })),
        );
      }

      if (deletedTools.length > 0) {
        await deleteAllAgentToTools(
          id,
          deletedTools.map(({ id }) => id),
        );
      }

      if (newDynamicBlocks.length > 0) {
        await createAllAgentToDynamicBlocks(
          newDynamicBlocks.map((block) => ({
            agentId: id,
            dynamicBlockId: block.id,
          })),
        );
      }

      if (deletedDynamicBlocks.length > 0) {
        const deleteIds = deletedDynamicBlocks.map(({ id }) => id);
        await deleteAllAgentToDynamicBlocks(id, deleteIds);
        await deleteAllDynamicBlocksHanging(deleteIds);
      }
    } else {
      agent = await createAgent({
        ...validatedData,
        userId: session.user.id,
      });

      if (formTools.length > 0) {
        await createAllAgentToTools(
          formTools.map((tool) => ({ agentId: agent.id, toolId: tool.id })),
        );
      }

      if (dynamicBlocks.length > 0) {
        await createAllAgentToDynamicBlocks(
          dynamicBlocks.map((block) => ({
            agentId: agent.id,
            dynamicBlockId: block.id,
          })),
        );
      }
    }

    return {
      status: 'success',
      data: mapAgent({
        ...agent,
        tools: formTools.map((tool) => ({ tool })),
        dynamicBlocks: dynamicBlocks.map((dynamicBlock) => ({ dynamicBlock })),
      }),
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: 'invalid_data', data: null, errors: error.errors };
    }

    console.error('Failed to save agent', error);
    return { status: 'failed', data: null };
  }
}

export async function deleteAgent({ id }: { id: string }) {
  const session = await auth();
  const agent = await getAgentById({ id });

  if (!agent || !session?.user?.id || session.user.id !== agent.userId) {
    return notFound();
  }

  await deleteAgentById({ id });
}

export async function saveFlowTool(
  _: ActionStateData,
  formData: FormData,
): Promise<ActionStateData> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return notFound();
    }

    const id = formData.get('id') as string;
    const { flowId, ...validatedData } = flowToolSchema.parse({
      name: formData.get('name'),
      verboseName: formData.get('verboseName'),
      description: formData.get('description'),
      flowId: formData.get('flowId'),
    });

    let tool: Tool;
    const { name, verboseName, description, parameters } = createChatFlowTool(
      flowId,
      validatedData,
    );
    const data = {
      source: 'langflow',
      name,
      verboseName,
      description,
      parameters: zerialize(parameters),
      data: { flowId },
    } as const;
    if (id) {
      const flowTool = await getToolById({ id });
      const isFlowSource = flowTool?.source === data.source;

      if (flowTool?.userId !== session.user.id || !isFlowSource) {
        return notFound();
      }

      tool = await updateTool({ id, ...data });
    } else {
      tool = await createTool({ ...data, userId: session.user.id });
    }

    return { status: 'success', data: mapTool(tool) };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: 'invalid_data', data: null, errors: error.errors };
    }

    console.error('Failed to save tool', error);
    return { status: 'failed', data: null };
  }
}
