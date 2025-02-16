import {
  type Message,
  createDataStreamResponse,
  convertToCoreMessages,
  smoothStream,
  streamText,
} from 'ai';

import { auth } from '@/app/(auth)/auth';
import {
  getModelData,
  isImagesAllowed,
  isModelValid,
  isReasoningAllowed,
  isToolsAllowed,
  type ChatModel,
} from '@/lib/ai/models';
import { getModel } from '@/lib/ai/models.server';
import {
  deleteChatById,
  getChatById,
  getAgentById,
  saveMessages,
} from '@/lib/db/queries';
import {
  generateUUID,
  getMostRecentUserMessage,
  hasAttachment,
  sanitizeResponseMessages,
} from '@/lib/utils';
import { toCoreTools } from '@/lib/agents/tool';
import { insertDynamicBlocksIntoPrompt } from '@/lib/agents/dynamic-blocks.server';

export const maxDuration = 300;

export async function POST(request: Request) {
  const {
    id,
    messages,
    provider,
    modelId,
  }: { id: string; messages: Array<Message>; provider: string; modelId: string } =
    await request.json();

  if (!isModelValid(provider, modelId)) {
    return new Response('Model not found', { status: 404 });
  }

  const modelData = getModelData(provider, modelId);
  if (!isImagesAllowed(modelData) && hasAttachment(messages)) {
    return new Response('Attachment not allowed for this model', {
      status: 400,
    });
  }

  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return new Response('Unauthorized', { status: 401 });
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

  await saveMessages({
    messages: [
      {
        ...userMessage,
        // biome-ignore lint/style/noNonNullAssertion: Checked userMessasge
        id: messages.at(-1)!.id,
        createdAt: new Date(),
        chatId: chat.id,
      },
    ],
  });
  const agentTools = agent.tools.map(({ tool }) => tool);

  const formattedSystemPrompt = insertDynamicBlocksIntoPrompt(
    agent.systemPrompt,
    agent.dynamicBlocks.map(({ dynamicBlock }) => dynamicBlock),
  );

  return createDataStreamResponse({
    execute: (dataStream) => {
      const coreTools = isToolsAllowed(modelData)
        ? toCoreTools(agentTools, {
            // biome-ignore lint/style/noNonNullAssertion: <explanation>
            userId: session.user!.id!,
            dataStream,
            agent,
          })
        : undefined;

      const result = streamText({
        model: getModel(
          provider as keyof ChatModel,
          modelId as keyof ChatModel[keyof ChatModel],
        ),
        system: formattedSystemPrompt,
        messages: coreMessages,
        maxSteps: 5,
        tools: coreTools,
        experimental_transform: smoothStream({ chunking: 'word' }),
        onFinish: async ({ response, reasoning, finishReason }) => {
          if (session.user?.id && finishReason !== 'error') {
            try {
              const responseMessagesWithoutIncompleteToolCalls =
                sanitizeResponseMessages({
                  messages: response.messages,
                  reasoning,
                });

              await saveMessages({
                messages: responseMessagesWithoutIncompleteToolCalls.map(
                  (message) => {
                    const messageId = generateUUID();

                    if (message.role === 'assistant') {
                      dataStream.writeMessageAnnotation({
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
        },
        experimental_telemetry: {
          isEnabled: true,
          functionId: 'stream-text',
          metadata: {
            // biome-ignore lint/style/noNonNullAssertion: <explanation>
            userId: session.user?.id!,
          },
        },
      });

      result.mergeIntoDataStream(dataStream, {
        sendReasoning: isReasoningAllowed(modelData),
      });
    },
    onError: (error) => {
      console.log(error);

      return 'Oops, an error occured!';
    },
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
