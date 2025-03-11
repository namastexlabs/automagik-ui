'use server';

import type { Message } from 'ai';
import { z } from 'zod';

import type { VisibilityType } from '@/components/visibility-selector';
import type { ActionStateData, ActionStateStatus } from '@/app/types';
import type { Chat, Tool } from '@/lib/db/schema';
import { notFound } from 'next/navigation';
import {
  type ClientTool,
  type ClientAgent,
  mapAgent,
  mapTool,
} from '@/lib/data';
import { getUser } from '@/lib/auth';
import {
  createChat as createChatRepository,
  removeChatById,
  updateVisibility,
} from '@/lib/repositories/chat';
import {
  createAgent,
  updateAgent,
  removeAgent,
  duplicateAgent as duplicateAgentRepository,
} from '@/lib/repositories/agent';
import { createFlowTool, updateFlowTool } from '@/lib/repositories/tool';
import { removeTrailingMessages } from '@/lib/repositories/message';
import { ApplicationError, ConflictError } from '@/lib/errors';

const agentFormSchema = z.object({
  name: z.string().trim(),
  systemPrompt: z.string(),
  visibility: z.enum(['public', 'private']).default('private'),
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
  visibility: z.enum(['public', 'private']).default('private'),
});

export type FlowToolSchema = typeof flowToolSchema;

export async function deleteTrailingMessages({ id }: { id: string }) {
  const session = await getUser();
  if (!session?.user?.id) {
    return notFound();
  }

  await removeTrailingMessages(id, session.user.id);
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

  await updateVisibility({ chatId, userId: session.user.id, visibility });
}

export async function createChat({
  agentId,
  messages,
}: {
  agentId: string;
  messages: Message[];
}): Promise<{ status: 'failed' | 'success'; data?: Chat; error?: string }> {
  try {
    const session = await getUser();

    if (!session?.user?.id) {
      return notFound();
    }

    const chat = await createChatRepository({
      agentId,
      userId: session.user.id,
      messages,
    });

    return { status: 'success', data: chat };
  } catch (error) {
    if (error instanceof ApplicationError) {
      return { status: 'failed', error: error.message };
    }
    console.error('Failed to create chat', error);
    return { status: 'failed' };
  }
}

export async function deleteChat({ id }: { id: string }): Promise<{
  status: Exclude<
    ActionStateStatus['status'],
    'idle' | 'in_progress' | 'invalid_data'
  >;
  error?: string;
}> {
  const session = await getUser();
  if (!session?.user?.id) {
    return notFound();
  }

  try {
    await removeChatById(id, session.user.id);
    return { status: 'success' };
  } catch (error) {
    if (error instanceof ApplicationError) {
      return { status: 'failed', error: error.message };
    }
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
      return notFound();
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
    const id = formData.get('id') as string;
    const data = {
      userId: session.user.id,
      ...validatedData,
    };

    const agent = await (id ? updateAgent({ id, ...data }) : createAgent(data));

    return {
      status: 'success',
      data: mapAgent(session.user.id, agent),
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

    if (error instanceof ConflictError) {
      return {
        status: 'invalid_data',
        data: null,
        errors: {
          _errors: [],
          name: {
            _errors: [error.message],
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

  try {
    const newAgent = await duplicateAgentRepository(id, session.user.id);
    return {
      status: 'success',
      data: mapAgent(session.user.id, newAgent),
    };
  } catch (error) {
    if (error instanceof ApplicationError) {
      return {
        status: 'failed',
        error: error.message,
      };
    }
    console.error('Failed to duplicate agent', error);
    return {
      status: 'failed',
      error: 'An unexpected error occurred',
    };
  }
}

export async function deleteAgent({ id }: { id: string }) {
  const session = await getUser();
  if (!session?.user?.id) {
    return notFound();
  }

  try {
    await removeAgent(id, session.user.id);
    return { status: 'success' };
  } catch (error) {
    if (error instanceof ApplicationError) {
      return { status: 'failed', error: error.message };
    }
    console.error('Failed to delete agent', error);
    return { status: 'failed' };
  }
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
    const validatedData = flowToolSchema.parse({
      name: formData.get('name'),
      verboseName: formData.get('verboseName'),
      description: formData.get('description'),
      flowId: formData.get('flowId'),
      visibility: formData.get('visibility'),
    });

    let tool: Tool;
    const data = { ...validatedData, userId: session.user.id } as const;
    if (id) {
      tool = await updateFlowTool({ id, ...data });
    } else {
      tool = await createFlowTool(data);
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

    if (error instanceof ConflictError) {
      return {
        status: 'invalid_data',
        data: null,
        errors: {
          _errors: [],
          verboseName: {
            _errors: [error.message],
          },
        },
      };
    }

    console.error('Failed to save tool', error);
    return { status: 'failed', data: null };
  }
}
