'use server';

import {
  convertToCoreMessages,
  type CoreMessage,
  generateText,
  type Message,
} from 'ai';
import { z } from 'zod';
import { zerialize } from 'zodex';

import isUniqueConstraintError, {
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
  getAgentByNameAndUserId,
} from '@/lib/db/queries';
import { getOrCreateAllDynamicBlocks } from '@/lib/agents/dynamic-blocks.server';
import type { VisibilityType } from '@/components/visibility-selector';
import type { ActionStateData, ActionStateStatus } from '@/app/types';
import type { Agent, Chat, Tool } from '@/lib/db/schema';
import { notFound } from 'next/navigation';
import {
  generateUUID,
  getDiffRelation,
  getMostRecentUserMessage,
} from '@/lib/utils';
import {
  type ClientTool,
  type ClientAgent,
  mapAgent,
  mapTool,
} from '@/lib/data';
import { createChatFlowTool } from '@/lib/agents/automagik';
import { accessModel } from '@/lib/ai/models';
import { getModel } from '@/lib/ai/models.server';
import { getUser } from '@/lib/auth';

const agentFormSchema = z.object({
  name: z.string().trim(),
  systemPrompt: z.string(),
  visibility: z.enum(['public', 'private']).optional(),
  tools: z.array(z.string()).default([]),
  dynamicBlocks: z
    .array(
      z.object({
        name: z.string().trim(),
        visibility: z.enum(['public', 'private']),
      }),
    )
    .refine(
      (items) => new Set(items.map((item) => item.name)).size === items.length,
      { message: 'Dynamic block names must be unique' },
    )
    .default([]),
});

export type AgentSchema = typeof agentFormSchema;

const flowToolSchema = z.object({
  name: z.string().trim(),
  verboseName: z.string().trim(),
  description: z.string(),
  flowId: z.string().trim(),
  visibility: z.enum(['public', 'private']).optional(),
});

export type FlowToolSchema = typeof flowToolSchema;

export async function generateTitleFromUserMessage({
  message,
}: {
  message: CoreMessage;
}) {
  const { text: title } = await generateText({
    model: getModel(...accessModel('openai', 'gpt-4-turbo')),
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
  const session = await getUser();
  const message = await getMessageById({ id });

  if (!message) {
    return notFound();
  }

  if (!session?.user?.id || message.chat.userId !== session.user.id) {
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
  const session = await getUser();

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
    const session = await getUser();

    if (!session?.user?.id) {
      return notFound();
    }

    const agent = await getAgentById({ id: agentId });

    const hasPermission =
      agent &&
      (agent.visibility === 'public' || agent.userId === session.user.id);

    if (!hasPermission) {
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
  const session = await getUser();
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
  _: ActionStateData<ClientAgent, typeof agentFormSchema>,
  formData: FormData,
): Promise<ActionStateData<ClientAgent, typeof agentFormSchema>> {
  try {
    const session = await getUser();

    if (!session?.user?.id) {
      return { status: 'failed', data: null };
    }

    const validatedData = agentFormSchema.parse({
      name: formData.get('name'),
      systemPrompt: formData.get('systemPrompt'),
      tools: formData.getAll('tools'),
      visibility: formData.get('visibility'),
      dynamicBlocks: formData
        .getAll('dynamicBlocks')
        .map((item) => JSON.parse(item as string)),
    });

    const formTools = await getAllToolsById(
      validatedData.tools,
      session.user.id,
    );
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
        visibility: validatedData.visibility,
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
        name: validatedData.name,
        systemPrompt: validatedData.systemPrompt,
        visibility: validatedData.visibility,
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
      data: mapAgent(session.user.id, {
        ...agent,
        tools: formTools.map((tool) => ({ tool })),
        dynamicBlocks: dynamicBlocks.map((dynamicBlock) => ({ dynamicBlock })),
      }),
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError<z.infer<typeof agentFormSchema>>;
      return {
        status: 'invalid_data',
        data: null,
        errors: zodError.format(),
      };
    }

    if (isUniqueConstraintError(error)) {
      const errorMessage = `Agent with the same name already exists ${formData.get('visibility') === 'private' ? 'for this user' : 'for the application, change the visiblity to private or change the name'}`;
      return {
        status: 'invalid_data',
        data: null,
        errors: {
          _errors: [],
          name: {
            _errors: [errorMessage],
          },
        },
      };
    }

    console.error('Failed to save agent', error);
    return { status: 'failed', data: null };
  }
}

export async function duplicateAgent({ id }: { id: string }) {
  const session = await getUser();

  if (!session?.user?.id) {
    return notFound();
  }

  const agent = await getAgentById({ id });

  const isOwner = session.user.id === agent?.userId;
  if (!agent || (!isOwner && agent.visibility === 'private')) {
    return notFound();
  }

  try {
    const hasSameAgent = await getAgentByNameAndUserId({
      name: agent.name,
      userId: session.user.id,
    });

    if (hasSameAgent) {
      return {
        status: 'exists',
        data: null,
      };
    }

    const newAgent = await createAgent({
      name: agent.name,
      systemPrompt: agent.systemPrompt,
      visibility: 'private',
      userId: session.user.id,
    });

    if (agent.tools.length > 0) {
      await createAllAgentToTools(
        agent.tools.map(({ tool }) => ({
          agentId: newAgent.id,
          toolId: tool.id,
        })),
      );
    }

    if (agent.dynamicBlocks.length > 0) {
      await createAllAgentToDynamicBlocks(
        agent.dynamicBlocks.map(({ dynamicBlock }) => ({
          agentId: newAgent.id,
          dynamicBlockId: dynamicBlock.id,
        })),
      );
    }

    return {
      status: 'success',
      data: mapAgent(session.user.id, {
        ...newAgent,
        tools: agent.tools.map(({ tool }) => ({ tool })),
        dynamicBlocks: agent.dynamicBlocks.map(({ dynamicBlock }) => ({
          dynamicBlock,
        })),
      }),
    };
  } catch (error) {
    console.error('Failed to duplicate agent', error);
    return { status: 'failed', data: null };
  }
}

export async function deleteAgent({ id }: { id: string }) {
  const session = await getUser();
  const agent = await getAgentById({ id });

  if (!agent || !session?.user?.id || session.user.id !== agent.userId) {
    return notFound();
  }

  await deleteAgentById({ id });
}

export async function saveFlowTool(
  _: ActionStateData<ClientTool, typeof flowToolSchema>,
  formData: FormData,
): Promise<ActionStateData<ClientTool, typeof flowToolSchema>> {
  try {
    const session = await getUser();

    if (!session?.user?.id) {
      return notFound();
    }

    const id = formData.get('id') as string;
    const { flowId, ...validatedData } = flowToolSchema.parse({
      name: formData.get('name'),
      verboseName: formData.get('verboseName'),
      description: formData.get('description'),
      flowId: formData.get('flowId'),
      visibility: formData.get('visibility'),
    });

    let tool: Tool;
    const { name, verboseName, description, parameters } = createChatFlowTool(
      flowId,
      validatedData,
    );
    const data = {
      source: 'automagik',
      name,
      verboseName,
      description,
      parameters: parameters && zerialize(parameters),
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

    return { status: 'success', data: mapTool(session.user.id, tool) };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        status: 'invalid_data',
        data: null,
        errors: error.format() as z.ZodFormattedError<
          z.infer<typeof flowToolSchema>
        >,
      };
    }

    if (isUniqueConstraintError(error)) {
      const errorMessage = `Tool with the same name already exists ${formData.get('visibility') === 'private' ? 'for this user' : 'for the application, change the visiblity to private or change the name'}`;
      return {
        status: 'invalid_data',
        data: null,
        errors: {
          _errors: [],
          verboseName: {
            _errors: [errorMessage],
          },
        },
      };
    }

    console.error('Failed to save tool', error);
    return { status: 'failed', data: null };
  }
}
