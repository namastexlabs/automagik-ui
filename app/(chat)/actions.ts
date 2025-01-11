'use server';

import {
  convertToCoreMessages,
  generateText,
  type Message,
  type CoreMessage,
} from 'ai';
import { cookies } from 'next/headers';
import { z } from 'zod';

import { customModel } from '@/lib/ai';
import {
  createAgentToTool,
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
  getAllAgentToTools,
  deleteAllAgentToTools,
  type AgentWithTools,
} from '@/lib/db/queries';
import type { VisibilityType } from '@/components/visibility-selector';
import { auth } from '@/app/(auth)/auth';
import type { Agent, Chat } from '@/lib/db/schema';
import { notFound } from 'next/navigation';
import { generateUUID, getMostRecentUserMessage } from '@/lib/utils';

export type SaveAgentActionState = {
  status: 'failed' | 'invalid_data' | 'success' | 'idle' | 'in_progress';
  data: AgentWithTools | null;
};

const agentFormSchema = z.object({
  name: z.string(),
  systemPrompt: z.string(),
  tools: z.array(z.string()).default([]),
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
  const [message] = await getMessageById({ id });

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

export async function deleteChat({
  id,
}: { id: string }): Promise<{ status: 'failed' | 'success' }> {
  const session = await auth();
  const chat = await getChatById({ id });

  if (!session?.user?.id || !chat || chat.userId !== session.user.id) {
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
  _: SaveAgentActionState,
  formData: FormData,
): Promise<SaveAgentActionState> {
  try {
    const id = formData.get('id') as string;
    const validatedData = agentFormSchema.parse({
      name: formData.get('name'),
      systemPrompt: formData.get('systemPrompt'),
      tools: formData.getAll('tools'),
    });

    const session = await auth();

    if (!session?.user?.id) {
      return { status: 'failed', data: null };
    }

    const formTools = await getAllToolsById(validatedData.tools);

    let agent: Agent;
    if (id) {
      agent = await updateAgent({
        id,
        name: validatedData.name,
        systemPrompt: validatedData.systemPrompt,
      });

      const agentTools = await getAllAgentToTools(id);
      const newTools = formTools.filter(
        (tool) => !agentTools.find((at) => at.toolId === tool.id),
      );
      const deletedTools = agentTools.filter(
        (at) => !formTools.find((tool) => tool.id === at.toolId),
      );

      if (newTools.length > 0) {
        await createAgentToTool(
          newTools.map((tool) => ({ agentId: id, toolId: tool.id })),
        );
      }

      if (deletedTools.length > 0) {
        await deleteAllAgentToTools(
          id,
          deletedTools.map(({ toolId }) => toolId),
        );
      }
    } else {
      agent = await createAgent({
        ...validatedData,
        userId: session.user.id,
      });

      await createAgentToTool(
        formTools.map((tool) => ({ agentId: agent.id, toolId: tool.id })),
      );
    }

    return { status: 'success', data: {
      ...agent,
      tools: formTools.map(tool => ({ tool })),
    } };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: 'invalid_data', data: null };
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
