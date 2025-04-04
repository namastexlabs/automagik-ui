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
import { useSWRConfig } from 'swr';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useLocalStorage } from 'usehooks-ts';
import { useProgress } from '@bprogress/next';

import type { ChatDTO } from '@/lib/data/chat';
import { useCurrentAgent } from '@/hooks/use-current-agent';
import type { AgentWithMessagesDTO } from '@/lib/data/agent';
import {
  ChatContext,
  ChatInputContext,
  ChatMessagesContext,
  ChatHandlersContext,
} from '@/contexts/chat';
import { createChatAction } from '@/app/(chat)/actions';
import { generateUUID } from '@/lib/utils';
import { getModelData, isImagesAllowed } from '@/lib/ai/models';

import { DataStreamHandler } from './data-stream-handler';
import { useSidebar } from './ui/sidebar';

export function ChatProvider({
  chat,
  initialMessages,
  children,
  modelId,
  provider,
  isReadOnly,
}: PropsWithChildren<{
  chat?: ChatDTO;
  initialMessages: Message[];
  modelId: string;
  provider: string;
  isReadOnly: boolean;
}>) {
  const searchParams = useSearchParams();
  const { openAgentListDialog } = useSidebar();
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

  const [temperature, setTemperature] = useState(0.7);
  const [topP, setTopP] = useState(0.9);
  const [presencePenalty, setPresencePenalty] = useState(0);
  const [frequencyPenalty, setFrequencyPenalty] = useState(0);

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
    generateId: generateUUID,
    initialInput: getLocalStorageInput(),
    sendExtraMessageFields: true,
    experimental_throttle: 100,
    body: {
      isExtendedThinking,
      modelId: selectedModelId,
      provider: selectedProvider,
      temperature,
      topP,
      presencePenalty,
      frequencyPenalty,
    },
  });

  const { mutate, cache } = useSWRConfig();
  const router = useRouter();
  const { agent: currentAgent } = useCurrentAgent();

  const shouldSubmit = !!searchParams.get('submit');
  const _input = isMounted.current ? input : '';

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
    async (messages: Message[], agentId: string) => {
      if (!chat) {
        setProgress(0.1);
        const { errors, data } = await createChatAction(agentId, messages);

        if (errors) {
          stopProgress();
          toast.error(errors._errors?.[0] || 'Failed to create chat');
        }

        return data;
      }

      return chat;
    },
    [chat, setProgress, stopProgress],
  );

  const reloadMessage = useCallback(async () => {
    await reload();
    mutate(`/api/history?agentId=${currentAgent?.id}`);
  }, [reload, currentAgent?.id, mutate]);

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
      agentId: string | undefined,
    ) => {
      if (content.trim().length === 0) {
        return;
      }

      if (!agentId) {
        openAgentListDialog(true);
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
        const data = await getOrCreateChat([message], agentId);
        if (!data) {
          setIsSubmitting(false);
          return;
        }

        if (!chat) {
          router.push(`/chat/${data.id}?submit=true`);
          return;
        }

        setInput('');
        setAttachments([]);

        if (shouldRemoveLastMessage) {
          setMessages((messages) => messages.slice(0, -1));
        }

        await append(message, {
          body: { id: data.id },
          experimental_attachments: newAttachments,
        });

        const recentAgents = cache.get('/api/agents/recent');
        const hasAgent = !!recentAgents?.data?.some(
          (agent: AgentWithMessagesDTO) => agent.id === agentId,
        );

        if (!hasAgent) {
          mutate('/api/agents/recent');
        }

        mutate(`/api/history?agentId=${agentId}`);

        if (shouldSubmit) {
          router.replace(`/chat/${data.id}`);
        }
        setIsSubmitting(false);
      } catch {
        setIsSubmitting(false);
      }
    },
    [
      getOrCreateChat,
      setInput,
      mutate,
      setAttachments,
      shouldRemoveLastMessage,
      append,
      chat,
      cache,
      shouldSubmit,
      openAgentListDialog,
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

    if (shouldSubmit && currentAgent) {
      isAutoSubmitting.current = true;
      onSubmit(input, attachments, currentAgent.id);
    }
  }, [shouldSubmit, onSubmit, input, attachments, currentAgent]);

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
      temperature,
      topP,
      presencePenalty,
      frequencyPenalty,
    };
  }, [
    _input,
    attachments,
    temperature,
    topP,
    presencePenalty,
    frequencyPenalty,
  ]);

  const chatHandlersContextValue = useMemo(() => {
    return {
      setModelId,
      setProvider,
      setInput,
      setAttachments,
      setMessages,
      setTemperature,
      setTopP,
      setPresencePenalty,
      setFrequencyPenalty,
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
