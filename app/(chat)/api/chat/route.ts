import {
  type Message,
  StreamData,
  convertToCoreMessages,
  streamText,
} from 'ai';

import { auth } from '@/app/(auth)/auth';
import { customModel } from '@/lib/ai';
import { models } from '@/lib/ai/models';
import {
  deleteChatById,
  getAgentById,
  getChatById,
  saveMessages,
} from '@/lib/db/queries';
import {
  generateUUID,
  getMostRecentUserMessage,
  sanitizeResponseMessages,
} from '@/lib/utils';
import { toCoreTools } from '@/lib/agents/tool';

export const maxDuration = 60;

const getSystemPrompt = (
  agentPrompt: string,
  dynamicBlocks: { name: string; content: string }[],
) => `\
You are a friendly assistant! Keep your responses concise and helpful.
The tools have its own rendering through ReactJS, so you don't need to show the result of a tool.

Use the following memories saved from user interaction, save new memories about the user with the saveMemories tool:
${dynamicBlocks.map(({ name, content }) => `* ${name}: ${content}`).join('\n')}

Here's your task:
${agentPrompt}
`;

export async function POST(request: Request) {
  const {
    id,
    messages,
    modelId,
  }: {
    id: string;
    messages: Array<Message>;
    modelId: string;
  } = await request.json();

  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const model = models.find((model) => model.id === modelId);

  if (!model) {
    return new Response('Model not found', { status: 404 });
  }

  const chat = await getChatById({ id });

  if (!chat || chat.userId !== session.user.id) {
    return new Response('Chat not found', { status: 404 });
  }

  const agent = await getAgentById({ id: chat.agentId });

  if (!agent) {
    return new Response('Unexpected error', { status: 500 });
  }

  const coreMessages = convertToCoreMessages(messages);
  const userMessage = getMostRecentUserMessage(coreMessages);

  if (!userMessage) {
    return new Response('No user message found', { status: 400 });
  }

  const userMessageId = generateUUID();
  await saveMessages({
    messages: [
      {
        ...userMessage,
        id: userMessageId,
        createdAt: new Date(),
        chatId: chat.id,
      },
    ],
  });

  const streamingData = new StreamData();

  streamingData.append({
    type: 'user-message-id',
    content: userMessageId,
  });
  const agentTools = agent.tools.map(({ tool }) => tool);
  const coreTools = toCoreTools(agentTools, {
    userId: session.user.id,
    model,
    streamingData,
    agent,
  });

  const result = streamText({
    model: customModel(model.apiIdentifier),
    system: getSystemPrompt(agent.systemPrompt, agent.dynamicBlocks),
    messages: coreMessages,
    maxSteps: 5,
    tools: coreTools,
    onFinish: async ({ response }) => {
      if (session.user?.id) {
        try {
          const responseMessagesWithoutIncompleteToolCalls =
            sanitizeResponseMessages(response.messages);

          await saveMessages({
            messages: responseMessagesWithoutIncompleteToolCalls.map(
              (message) => {
                const messageId = generateUUID();

                if (message.role === 'assistant') {
                  streamingData.appendMessageAnnotation({
                    messageIdFromServer: messageId,
                  });
                }

                return {
                  id: messageId,
                  chatId: chat.id,
                  role: message.role,
                  content: message.content,
                  createdAt: new Date(),
                };
              },
            ),
          });
        } catch (error) {
          console.error('Failed to save chat');
        }
      }

      streamingData.close();
    },
    experimental_telemetry: {
      isEnabled: true,
      functionId: 'stream-text',
    },
  });

  return result.toDataStreamResponse({
    data: streamingData,
  });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Not Found', { status: 404 });
  }

  const session = await auth();

  if (!session || !session.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const chat = await getChatById({ id });

    if (!chat) {
      return new Response('Chat not found', { status: 404 });
    }

    if (chat.userId !== session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    await deleteChatById({ id });

    return new Response('Chat deleted', { status: 200 });
  } catch (error) {
    return new Response('An error occurred while processing your request', {
      status: 500,
    });
  }
}
