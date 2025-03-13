'use client';

import { type Message, useChat } from '@ai-sdk/react';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import type { Attachment } from 'ai';
import { useSWRConfig } from 'swr';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useProgress } from '@bprogress/next';

import {
  ChatContext,
  ChatInputContext,
  ChatMessagesContext,
  ChatHandlersContext,
} from '@/contexts/chat';
import type { AgentDTO } from '@/lib/data/agent';
import type { Chat } from '@/lib/db/schema';
import { createChatAction } from '@/app/(chat)/actions';
import { generateUUID } from '@/lib/utils';
import { getModelData, isImagesAllowed } from '@/lib/ai/models';

import { DataStreamHandler } from './data-stream-handler';

export function ChatProvider({
  chat,
  initialMessages,
  children,
  modelId,
  provider,
  isReadOnly,
  setOpenAgentListDialog,
  setAgentDialogState,
}: PropsWithChildren<{
  chat?: Chat;
  initialMessages: Message[];
  modelId: string;
  provider: string;
  isReadOnly: boolean;
  setOpenAgentListDialog: (isOpen: boolean) => void;
  setAgentDialogState: (state: {
    agentId: string | null;
    isOpen: boolean;
    isSubmitting: boolean;
  }) => void;
}>) {
  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const [selectedProvider, setProvider] = useState(provider);
  const [selectedModelId, setModelId] = useState(modelId);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [isExtendedThinking, setIsExtendedThinking] = useState(false);
  const { set: setProgress, stop: stopProgress } = useProgress();

  const {
    messages,
    setMessages,
    input,
    setInput,
    append,
    status,
    stop,
    reload,
    error,
    data,
  } = useChat({
    id: chat?.id,
    initialMessages,
    sendExtraMessageFields: true,
    experimental_throttle: 50,
    body: {
      isExtendedThinking,
    },
  });
  const { mutate } = useSWRConfig();
  const router = useRouter();

  const getLocalStorageInput = useCallback(() => {
    return localStorage.getItem('input') || '';
  }, []);

  const setLocalStorageInput = useCallback((value: string) => {
    localStorage.setItem('input', value);
  }, []);

  useEffect(() => {
    setInput(getLocalStorageInput());
  }, [setInput, getLocalStorageInput]);

  useEffect(() => {
    setLocalStorageInput(input);
  }, [input, setLocalStorageInput]);

  useEffect(() => {
    setAttachments([]);
  }, [chat]);

  useEffect(() => {
    if (isCreatingChat) {
      setProgress(0.1);
    }
  }, [isCreatingChat, setProgress]);

  const isImageAllowed = isImagesAllowed(
    getModelData(selectedProvider, selectedModelId),
  );
  useEffect(() => {
    if (!isImageAllowed) {
      setAttachments([]);
    }
  }, [isImageAllowed]);

  useEffect(() => {
    setIsExtendedThinking(false);
  }, [modelId]);

  const getOrCreateChat = useCallback(
    async (messages: Message[], tab: string) => {
      if (!chat) {
        setIsCreatingChat(true);
        const { errors, data } = await createChatAction(tab, messages);

        if (errors) {
          toast.error(errors._errors?.[0] || 'Failed to create chat');
        }

        if (data) {
          mutate(`/api/history?agentId=${tab}`, data, {
            revalidate: false,
            populateCache: (data, history = []) => {
              return [data, ...history];
            },
          });
        }
        setIsCreatingChat(false);

        return data;
      }

      return chat;
    },
    [chat, mutate],
  );

  const reloadMessage = useCallback(() => {
    return reload({
      body: {
        id: chat?.id,
        modelId: selectedModelId,
        provider: selectedProvider,
      },
    });
  }, [reload, chat?.id, selectedModelId, selectedProvider]);

  // Really weird error when a stream overflows or something like that
  const isStreamInputError =
    !!error &&
    error?.message.toLocaleLowerCase().includes('error in input stream');

  const currentError =
    (isStreamInputError && 'Unexpected error') || error?.message;
  const shouldRemoveLastMessage =
    !!error && messages.at(-1)?.role === 'assistant';

  const onSubmit = useCallback(
    async (
      content: string,
      newAttachments: Array<Attachment>,
      currentAgent: string | null,
      currentAgents: AgentDTO[],
      currentTabs: string[],
    ) => {
      if (content.trim().length === 0) {
        return;
      }

      if (currentAgents.length === 0) {
        setAgentDialogState({
          agentId: null,
          isOpen: true,
          isSubmitting: true,
        });
        return;
      }

      if (currentTabs.length === 0 || !currentAgent) {
        setOpenAgentListDialog(true);
        return;
      }

      setLocalStorageInput('');

      const message: Message = {
        id: generateUUID(),
        createdAt: new Date(),
        role: 'user',
        content,
        experimental_attachments: newAttachments,
      };

      const data = await getOrCreateChat([message], currentAgent);
      if (!data) {
        stopProgress();
        return;
      }

      setInput('');
      setAttachments([]);

      if (shouldRemoveLastMessage) {
        setMessages((messages) => messages.slice(0, -1));
      }

      await append(message, {
        body: {
          id: data.id,
          modelId: selectedModelId,
          provider: selectedProvider,
        },
        experimental_attachments: newAttachments,
      });

      if (!chat) {
        router.push(`/chat/${data.id}`);
      }
    },
    [
      setLocalStorageInput,
      getOrCreateChat,
      setInput,
      setAttachments,
      stopProgress,
      shouldRemoveLastMessage,
      append,
      selectedModelId,
      selectedProvider,
      chat,
      setAgentDialogState,
      setOpenAgentListDialog,
      setMessages,
      router,
    ],
  );

  const isLoading = status === 'submitted' || status === 'streaming';
  const chatContextValue = useMemo(() => {
    return {
      chat,
      isReadOnly,
      isImageAllowed,
      isExtendedThinking,
      modelId: selectedModelId,
      provider: selectedProvider,
      isLoading: isCreatingChat || isLoading,
      error: currentError || null,
    };
  }, [
    chat,
    isReadOnly,
    isExtendedThinking,
    selectedModelId,
    selectedProvider,
    isCreatingChat,
    isImageAllowed,
    isLoading,
    currentError,
  ]);

  const chatMessagesContextValue = useMemo(() => {
    return {
      messages: shouldRemoveLastMessage ? messages.slice(0, -1) : messages,
    };
  }, [messages, shouldRemoveLastMessage]);

  const chatInputContextValue = useMemo(() => {
    return {
      input,
      attachments,
    };
  }, [input, attachments]);

  const chatHandlersContextValue = useMemo(() => {
    return {
      setModelId,
      setProvider,
      setInput,
      setAttachments,
      setMessages,
      stop,
      append,
      toggleExtendedThinking: () => setIsExtendedThinking((state) => !state),
      reload: reloadMessage,
      handleSubmit: onSubmit,
    };
  }, [
    setInput,
    setAttachments,
    setMessages,
    reloadMessage,
    stop,
    append,
    onSubmit,
  ]);

  return (
    <ChatContext value={chatContextValue}>
      <ChatInputContext value={chatInputContextValue}>
        <ChatMessagesContext value={chatMessagesContextValue}>
          <ChatHandlersContext value={chatHandlersContextValue}>
            {children}
            <DataStreamHandler dataStream={data} />
          </ChatHandlersContext>
        </ChatMessagesContext>
      </ChatInputContext>
    </ChatContext>
  );
}
