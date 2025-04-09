import {
  createDataStreamResponse,
  convertToCoreMessages,
  smoothStream,
  streamText,
  generateText,
  appendResponseMessages,
  type Message,
} from 'ai';
import type { NextRequest } from 'next/server';

import { getUser } from '@/lib/auth';
import {
  getModelData,
  isExtendedThinkingAllowed,
  isImagesAllowed,
  isModelValid,
  isReasoningAllowed,
  isToolsAllowed,
  type ChatModel,
} from '@/lib/ai/models';
import { getModel } from '@/lib/ai/models.server';
import {
  hasAttachment,
  sanitizeResponseMessages,
  sanitizeMessages,
} from '@/lib/utils.server';
import { generateUUID } from '@/lib/utils';
import { toCoreTools } from '@/lib/agents/tool';
import { insertDynamicBlocksIntoPrompt } from '@/lib/agents/dynamic-blocks';
import { getOrCreateChat } from '@/lib/repositories/chat';
import { getAgent } from '@/lib/repositories/agent';
import { createMessages } from '@/lib/repositories/message';
import { ApplicationError } from '@/lib/errors';
import {
  toHTTPResponse,
  handleApplicationError,
} from '@/lib/data/index.server';

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const {
    id,
    agentId,
    messages,
    provider,
    modelId,
    isExtendedThinking,
    temperature,
    topP,
    presencePenalty,
    frequencyPenalty,
  }: {
    id: string;
    agentId: string;
    messages: Message[];
    provider: string;
    modelId: string;
    isExtendedThinking: boolean;
    temperature?: number;
    topP?: number;
    presencePenalty?: number;
    frequencyPenalty?: number;
  } = await request.json();

  try {
    if (!isModelValid(provider, modelId)) {
      return new Response('Model not found', { status: 404 });
    }

    const modelData = getModelData(provider, modelId);
    if (!isImagesAllowed(modelData) && hasAttachment(messages)) {
      return new Response('Attachment not allowed for this model', {
        status: 400,
      });
    }

    const session = await getUser();

    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const userId = session.user.id;
    const chat = getOrCreateChat(id, agentId, userId, messages);

    const sanitizedMessages = isReasoningAllowed(modelData)
      ? messages
      : messages.map((message) => ({
          ...message,
          parts: message.parts?.filter((part) => part.type !== 'reasoning'),
        }));

    const agent = await getAgent(agentId, userId);
    const coreMessages = await sanitizeMessages(
      convertToCoreMessages(sanitizedMessages),
      provider,
      modelId,
      id,
    );
    const lastMessage = messages.at(-1);

    if (!lastMessage) {
      return new Response('No user message found', { status: 400 });
    }

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
              chatId: id,
              userMessage: lastMessage,
              abortSignal: request.signal,
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
          temperature,
          topP,
          presencePenalty,
          frequencyPenalty,
          abortSignal: request.signal,
          experimental_generateMessageId: generateUUID,
          messages: coreMessages,
          maxSteps: 5,
          tools,
          providerOptions:
            isExtendedThinking && isExtendedThinkingAllowed(modelData)
              ? {
                  anthropic: {
                    thinking: { type: 'enabled', budgetTokens: 8192 },
                  },
                }
              : undefined,
          experimental_transform: smoothStream({ chunking: 'word' }),
          onFinish: async ({ response, finishReason }) => {
            if (finishReason !== 'error') {
              const userMessage = {
                id: lastMessage.id,
                chatId: id,
                content: {
                  content: lastMessage.content,
                  parts: lastMessage.parts,
                  annotations: lastMessage.annotations,
                  experimental_attachments:
                    lastMessage.experimental_attachments,
                },
                role: 'user' as const,
                createdAt: new Date(),
              };

              try {
                const updatedMessages = appendResponseMessages({
                  messages,
                  responseMessages: sanitizeResponseMessages({
                    messages: response.messages,
                  }),
                }).slice(-1);

                await chat;
                await createMessages([
                  userMessage,
                  ...updatedMessages.map(
                    ({ createdAt, role, ...message }) => ({
                      content: message,
                      id: message.id,
                      createdAt: createdAt ?? new Date(),
                      chatId: id,
                      role,
                    }),
                  ),
                ]);
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
              abortSignal: request.signal,
              experimental_telemetry: {
                isEnabled: true,
                functionId: 'tool-repair',
                metadata: {
                  user_id: userId,
                  thread_id: id,
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
              thread_id: id,
              agent_id: agent.id,
            },
          },
        });

        result.mergeIntoDataStream(dataStream, {
          sendReasoning: isReasoningAllowed(modelData),
        });
      },
      onError: (error) => {
        if (request.signal.aborted) {
          throw error;
        }

        console.log(error);

        return 'Oops, an error occured!';
      },
    });
  } catch (error) {
    if (error instanceof ApplicationError) {
      return toHTTPResponse(handleApplicationError(error));
    }

    if (request.signal.aborted) {
      throw error;
    }

    console.log(error);
    return new Response('An error occurred while processing your request', {
      status: 500,
    });
  }
}
