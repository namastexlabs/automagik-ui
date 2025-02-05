import {
  type Message,
  createDataStreamResponse,
  convertToCoreMessages,
  smoothStream,
  streamText,
} from 'ai';

import { auth } from '@/app/(auth)/auth';
import { myProvider } from '@/lib/ai/models';
import {
  deleteChatById,
  getChatById,
  getAgentById,
  saveMessages,
} from '@/lib/db/queries';
import {
  generateUUID,
  getMostRecentUserMessage,
  sanitizeResponseMessages,
} from '@/lib/utils';
import { toCoreTools } from '@/lib/agents/tool';
import { insertDynamicBlocksIntoPrompt } from '@/lib/agents/dynamic-blocks.server';

export const maxDuration = 60;

export async function POST(request: Request) {
  const {
    id,
    messages,
    selectedChatModel,
  }: { id: string; messages: Array<Message>; selectedChatModel: string } =
    await request.json();

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

  const agentTools = agent.tools.map(({ tool }) => tool);

  const formattedSystemPrompt = insertDynamicBlocksIntoPrompt(
    agent.systemPrompt,
    agent.dynamicBlocks.map(({ dynamicBlock }) => dynamicBlock),
  );

  return createDataStreamResponse({
    execute: (dataStream) => {
      dataStream.writeData({
        type: 'user-message-id',
        content: userMessageId,
      });
      const coreTools = toCoreTools(agentTools, {
        // biome-ignore lint/style/noNonNullAssertion: <explanation>
        userId: session.user!.id!,
        dataStream,
        agent,
      });

      const result = streamText({
        model: myProvider.languageModel(selectedChatModel),
        system: formattedSystemPrompt,
        messages: coreMessages,
        maxSteps: 5,
        tools: coreTools,
        experimental_transform: smoothStream({ chunking: 'word' }),
        onFinish: async ({ response, reasoning }) => {
          if (session.user?.id) {
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
        },
      });

      result.mergeIntoDataStream(dataStream, {
        sendReasoning: true,
      });
    },
    onError: (error) => {
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
