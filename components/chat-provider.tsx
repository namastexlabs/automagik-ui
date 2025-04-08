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
import { useRouter, usePathname } from 'next/navigation';
import { useLocalStorage } from 'usehooks-ts';

import type { ChatDTO } from '@/lib/data/chat';
import { useCurrentAgent } from '@/hooks/use-current-agent';
import type { AgentWithMessagesDTO } from '@/lib/data/agent';
import {
  ChatContext,
  ChatInputContext,
  ChatMessagesContext,
  ChatHandlersContext,
} from '@/contexts/chat';
import { generateUUID } from '@/lib/utils';
import {
  getModelData,
  isImagesAllowed,
  isExtendedThinkingAllowed,
} from '@/lib/ai/models';
import { usePageUnloadWarning } from '@/hooks/use-page-unload-warning';

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
  const pathname = usePathname();
  const { openAgentListDialog } = useSidebar();
  const [attachments, setAttachments] = useLocalStorage<Array<Attachment>>(
    'input-attachments',
    [],
    { initializeWithValue: false },
  );
  const isMounted = useRef(false);
  const isStopped = useRef(false);

  const [selectedProvider, setProvider] = useState(provider);
  const [selectedModelId, setModelId] = useState(modelId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExtendedThinking, setIsExtendedThinking] = useLocalStorage(
    'chat-provider:extended-thinking',
    false,
    { initializeWithValue: false },
  );

  const [temperature, setTemperature] = useLocalStorage('temperature', 0.7, {
    initializeWithValue: false,
  });
  const [topP, setTopP] = useLocalStorage('topP', 0.9, {
    initializeWithValue: false,
  });
  const [presencePenalty, setPresencePenalty] = useLocalStorage(
    'presencePenalty',
    0,
    { initializeWithValue: false },
  );
  const [frequencyPenalty, setFrequencyPenalty] = useLocalStorage(
    'frequencyPenalty',
    0,
    { initializeWithValue: false },
  );

  const getLocalStorageInput = useCallback(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('input') || '';
    }
    return '';
  }, []);

  const { agent: currentAgent } = useCurrentAgent();

  const {
    messages,
    setMessages,
    input,
    setInput,
    append,
    status,
    stop: _stop,
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
      agentId: currentAgent?.id,
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
    if (!isExtendedThinkingAllowed(getModelData(provider, modelId))) {
      setIsExtendedThinking(false);
    }
  }, [modelId, provider, setIsExtendedThinking]);

  const stop = useCallback(() => {
    isStopped.current = true;
    _stop();
  }, [_stop]);

  const refetchResources = useCallback(() => {
    const recentAgents = cache.get('/api/agents/recent');
    const hasAgent = !!recentAgents?.data?.some(
      (agent: AgentWithMessagesDTO) => agent.id === currentAgent?.id,
    );

    if (!hasAgent) {
      mutate('/api/agents/recent');
    }

    mutate(`/api/history?agentId=${currentAgent?.id}`);
  }, [mutate, currentAgent?.id, cache]);

  const reloadMessage = useCallback(async () => {
    const chatId = chat?.id || generateUUID();
    await reload({
      body: {
        id: chatId,
      },
    });

    if (!chat) {
      router.replace(`/chat/${chatId}`);
    }

    refetchResources();
  }, [chat, reload, refetchResources, router]);

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
        setInput('');
        setAttachments([]);

        if (shouldRemoveLastMessage) {
          setMessages((messages) => messages.slice(0, -1));
        }

        const chatId = chat?.id || generateUUID();
        await append(message, {
          body: { id: chatId },
          experimental_attachments: newAttachments,
        });

        if (isStopped.current) {
          isStopped.current = false;
          return;
        }

        if (!chat) {
          router.replace(`/chat/${chatId}`);
        } else {
          setIsSubmitting(false);
        }

        refetchResources();
      } catch {
        setIsSubmitting(false);
      }
    },
    [
      openAgentListDialog,
      setInput,
      setAttachments,
      shouldRemoveLastMessage,
      chat,
      append,
      refetchResources,
      setMessages,
      router,
    ],
  );

  usePageUnloadWarning(isSubmitting);

  useEffect(() => {
    if (isSubmitting && pathname === `/chat/${chat?.id}`) {
      setIsSubmitting(false);
    }
  }, [isSubmitting, pathname, chat?.id]);

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
    setTemperature,
    setTopP,
    setPresencePenalty,
    setFrequencyPenalty,
    stop,
    append,
    reloadMessage,
    onSubmit,
    setIsExtendedThinking,
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
