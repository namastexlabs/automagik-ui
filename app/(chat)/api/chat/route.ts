import {
  createDataStreamResponse,
  convertToCoreMessages,
  smoothStream,
  streamText,
  generateText,
  appendResponseMessages,
  type Message,
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
import { convertCoreMessageAttachments } from '@/lib/utils.server';

type ReasoningUIPart = {
  type: 'reasoning';
  reasoning: string;
  details: Array<
    | {
        type: 'text';
        text: string;
        signature?: string;
      }
    | {
        type: 'redacted';
        data: string;
      }
  >;
};

export const maxDuration = 300;

export async function POST(request: Request) {
  const {
    id,
    messages,
    provider,
    modelId,
    isExtendedThinking,
  }: {
    id: string;
    messages: Message[];
    provider: string;
    modelId: string;
    isExtendedThinking: boolean;
  } = await request.json();

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
  const userId = session.user.id;

  const chat = await getChatById({ id });

  if (!chat || chat.userId !== userId) {
    return new Response('Chat not found', { status: 404 });
  }

  const agent = await getAgentById({ id: chat.agentId });

  if (!agent) {
    return new Response('Unexpected error', { status: 500 });
  }

  const coreMessages = convertToCoreMessages(messages);
  const lastMessage = messages.at(-1);
  const userMessage = getMostRecentUserMessage(coreMessages);

  if (!userMessage || !lastMessage) {
    return new Response('No user message found', { status: 400 });
  }

  const userMessageWithAttachments = await convertCoreMessageAttachments(
    userMessage,
    chat.id,
  );

  await saveMessages({
    messages: [
      {
        id: lastMessage.id,
        chatId: chat.id,
        content: {
          content: lastMessage.content,
          parts: lastMessage.parts,
          annotations: lastMessage.annotations,
          experimental_attachments: lastMessage.experimental_attachments,
        },
        role: 'user',
        createdAt: new Date(),
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
      const tools = isToolsAllowed(modelData)
        ? toCoreTools(agentTools, {
            userId,
            dataStream,
            agent,
            chat,
          })
        : undefined;

      const model = getModel(
        provider as keyof ChatModel,
        modelId as keyof ChatModel[keyof ChatModel],
      );
      const system = formattedSystemPrompt;
      const result = streamText({
        model,
        system,
        experimental_generateMessageId: generateUUID,
        messages: [...coreMessages.slice(0, -1), userMessageWithAttachments],
        maxSteps: 5,
        tools,
        providerOptions:
          isExtendedThinking && modelId === 'claude-3-7-sonnet-20250219'
            ? {
                anthropic: {
                  thinking: { type: 'enabled', budgetTokens: 8192 },
                },
              }
            : undefined,
        experimental_transform: smoothStream({ chunking: 'word' }),
        onFinish: async ({
          response,
          reasoning,
          reasoningDetails,
          finishReason,
        }) => {
          if (session.user?.id && finishReason !== 'error') {
            const updatedMessages = appendResponseMessages({
              messages,
              responseMessages: sanitizeResponseMessages({
                messages: response.messages,
              }),
            }).slice(-1);

            if (updatedMessages[0]?.parts && (reasoning || reasoningDetails)) {
              const reasoningPart: ReasoningUIPart = {
                type: 'reasoning',
                reasoning: reasoning || '',
                details: reasoningDetails || [],
              };

              updatedMessages[0].parts.unshift(reasoningPart);
            }

            try {
              await saveMessages({
                messages: updatedMessages.map(
                  ({ id, createdAt, role, ...message }) => ({
                    content: message,
                    id,
                    createdAt: createdAt ?? new Date(),
                    chatId: chat.id,
                    role,
                  }),
                ),
              });
            } catch (error) {
              console.log(error);
              throw new Error('Failed to save messages');
            }
          }
        },
        experimental_repairToolCall: async ({ toolCall, tools, error }) => {
          const result = await generateText({
            model,
            system,
            tools,
            experimental_telemetry: {
              isEnabled: true,
              functionId: 'tool-repair',
              metadata: {
                user_id: userId,
                thread_id: chat.id,
                agent_id: agent.id,
              },
            },
            messages: [
              ...coreMessages,
              {
                role: 'assistant',
                content: [
                  {
                    type: 'tool-call',
                    toolCallId: toolCall.toolCallId,
                    toolName: toolCall.toolName,
                    args: JSON.parse(toolCall.args),
                  },
                ],
              },
              {
                role: 'tool',
                content: [
                  {
                    type: 'tool-result',
                    toolCallId: toolCall.toolCallId,
                    toolName: toolCall.toolName,
                    result: `Something went wrong, the assistant should fix this tool call. \n${error.message}`,
                  },
                ],
              },
            ],
          });
          const newToolCall = result.toolCalls.findLast(
            (newToolCall) => newToolCall.toolName === toolCall.toolName,
          );

          return newToolCall !== undefined
            ? {
                toolCallType: 'function',
                toolCallId: toolCall.toolCallId,
                toolName: toolCall.toolName,
                args: JSON.stringify(newToolCall.args),
              }
            : null;
        },
        experimental_telemetry: {
          isEnabled: true,
          functionId: 'stream-text',
          metadata: {
            user_id: userId,
            thread_id: chat.id,
            agent_id: agent.id,
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
