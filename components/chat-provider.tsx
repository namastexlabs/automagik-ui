'use client';

import { type Message, useChat } from '@ai-sdk/react';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import type { Attachment } from 'ai';
import useSWR, { useSWRConfig } from 'swr';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useLocalStorage } from 'usehooks-ts';
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
import { useAgentTabs, useCurrentAgentTab } from '@/contexts/agent-tabs';
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
  const searchParams = useSearchParams();
  const [attachments, setAttachments] = useLocalStorage<Array<Attachment>>(
    'input-attachments',
    [],
    { initializeWithValue: false },
  );
  const isMounted = useRef(false);
  const isAutoSubmitting = useRef(false);

  const [selectedProvider, setProvider] = useState(provider);
  const [selectedModelId, setModelId] = useState(modelId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExtendedThinking, setIsExtendedThinking] = useState(false);
  const { set: setProgress, stop: stopProgress } = useProgress();

  const { currentTab } = useCurrentAgentTab();
  const { tabs } = useAgentTabs();
  const { data: agents = [] } = useSWR<AgentDTO[]>('/api/agents', null);

  const getLocalStorageInput = useCallback(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('input') || '';
    }
    return '';
  }, []);

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
    initialInput: getLocalStorageInput(),
    sendExtraMessageFields: true,
    experimental_throttle: 50,
    body: {
      isExtendedThinking,
    },
  });

  const { mutate } = useSWRConfig();
  const router = useRouter();

  const _input = isMounted.current ? input : '';
  const shouldSubmit = !!searchParams.get('submit');

  const setLocalStorageInput = useCallback((value: string) => {
    localStorage.setItem('input', value);
  }, []);

  useEffect(() => {
    isMounted.current = true;
  }, []);

  useEffect(() => {
    setInput(getLocalStorageInput());
  }, [setInput, getLocalStorageInput]);

  useEffect(() => {
    setLocalStorageInput(input);
  }, [input, setLocalStorageInput]);

  useEffect(() => {
    setAttachments([]);
  }, [chat, setAttachments]);

  const isImageAllowed = isImagesAllowed(
    getModelData(selectedProvider, selectedModelId),
  );
  useEffect(() => {
    if (!isImageAllowed) {
      setAttachments([]);
    }
  }, [isImageAllowed, setAttachments]);

  useEffect(() => {
    setIsExtendedThinking(false);
  }, [modelId]);

  const getOrCreateChat = useCallback(
    async (messages: Message[], tab: string) => {
      if (!chat) {
        setProgress(0.1);
        const { errors, data } = await createChatAction(tab, messages);

        if (errors) {
          stopProgress();
          toast.error(errors._errors?.[0] || 'Failed to create chat');
        }

        if (data) {
          mutate(`/api/history?agentId=${tab}`, data, {
            revalidate: false,
            populateCache: (data, history = []) => {
              return [data, ...history];
            },
          });

          router.push(`/chat/${data.id}?submit=true`);
        }

        return data;
      }

      return chat;
    },
    [chat, router, mutate, setProgress, stopProgress],
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
      if (content.trim().length === 0 || isSubmitting) {
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

      const message: Message = {
        id: generateUUID(),
        createdAt: new Date(),
        role: 'user',
        content,
        experimental_attachments: newAttachments,
      };

      setIsSubmitting(true);
      try {
        const data = await getOrCreateChat([message], currentAgent);
        if (!data || !chat) {
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

        if (shouldSubmit) {
          router.replace(`/chat/${data.id}`);
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      isSubmitting,
      getOrCreateChat,
      setInput,
      setAttachments,
      shouldRemoveLastMessage,
      append,
      selectedModelId,
      selectedProvider,
      chat,
      shouldSubmit,
      setAgentDialogState,
      setOpenAgentListDialog,
      setMessages,
      router,
    ],
  );

  useEffect(() => {
    if (!shouldSubmit) {
      isAutoSubmitting.current = false;
    }
  }, [shouldSubmit]);

  useEffect(() => {
    if (isAutoSubmitting.current) {
      return;
    }

    if (shouldSubmit && currentTab && tabs.length > 0) {
      isAutoSubmitting.current = true;
      onSubmit(input, attachments, currentTab, agents, tabs);
    }
  }, [shouldSubmit, onSubmit, input, attachments, currentTab, agents, tabs]);

  const isLoading = status === 'submitted' || status === 'streaming';
  const chatContextValue = useMemo(() => {
    return {
      chat,
      isReadOnly,
      isImageAllowed,
      isExtendedThinking,
      modelId: selectedModelId,
      provider: selectedProvider,
      isSubmitting,
      isLoading,
      error: currentError || null,
    };
  }, [
    chat,
    isReadOnly,
    isExtendedThinking,
    selectedModelId,
    selectedProvider,
    isImageAllowed,
    isLoading,
    currentError,
    isSubmitting,
  ]);

  const chatMessagesContextValue = useMemo(() => {
    return {
      messages: shouldRemoveLastMessage ? messages.slice(0, -1) : messages,
    };
  }, [messages, shouldRemoveLastMessage]);

  const chatInputContextValue = useMemo(() => {
    return {
      input: _input,
      attachments,
    };
  }, [_input, attachments]);

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
