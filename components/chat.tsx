'use client';

import type { Attachment, Message } from 'ai';
import { useChat } from 'ai/react';
import { useCallback, useEffect, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { toast } from 'sonner';
import { useParams, useRouter } from 'next/navigation';

import type { ClientAgent } from '@/lib/data';
import type { Chat as ChatType, Vote } from '@/lib/db/schema';
import { ChatHeader } from '@/components/chat-header';
import { fetcher, generateUUID } from '@/lib/utils';
import { createChat } from '@/app/(chat)/actions';
import { useAgentTabs, useCurrentAgentTab } from '@/contexts/agent-tabs';
import { useBlockSelector } from '@/hooks/use-block';

import type { VisibilityType } from './visibility-selector';
import { Block } from './block';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';

export function Chat({
  chat,
  initialAgents,
  initialMessages,
  selectedVisibilityType,
  isReadonly,
  modelId,
  provider,
}: {
  chat?: ChatType;
  initialMessages: Array<Message>;
  initialAgents: ClientAgent[];
  selectedVisibilityType: VisibilityType;
  modelId: string;
  provider: string;
  isReadonly: boolean;
}) {
  const { mutate } = useSWRConfig();
  const { id } = useParams();
  const router = useRouter();

  const { addTab, tabs } = useAgentTabs();
  const { currentTab, setTab } = useCurrentAgentTab();

  const { data: votes } = useSWR<Array<Vote>>(
    chat?.id ? `/api/vote?chatId=${chat.id}` : null,
    fetcher,
  );

  const {
    messages,
    setMessages,
    input,
    setInput,
    append,
    isLoading,
    stop,
    reload,
    error,
  } = useChat({
    id: chat?.id,
    initialMessages,
    experimental_throttle: 50,
    sendExtraMessageFields: true,
  });

  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [selectedProvider, setProvider] = useState(provider);
  const [selectedModelId, setModelId] = useState(modelId);
  const { data: agents = [] } = useSWR<ClientAgent[]>('/api/agents', fetcher, {
    revalidateOnMount: false,
  });

  const isBlockVisible = useBlockSelector((state) => state.isVisible);
  const [openAgentListDialog, setOpenAgentListDialog] = useState(false);
  const [agentDialogState, setAgentDialogState] = useState<{
    agentId: string | null;
    isOpen: boolean;
    isSubmitting: boolean;
  }>({ isOpen: false, agentId: null, isSubmitting: false });
  const [attachments, setAttachments] = useState<Array<Attachment>>([]);

  const changeAgentDialog = useCallback(
    (isOpen: boolean, agentId: string | null = null, isSubmitting = false) => {
      setAgentDialogState({
        agentId,
        isOpen,
        isSubmitting,
      });
    },
    [],
  );

  const getOrCreateChat = useCallback(
    async (messages: Message[], tab: string) => {
      if (!chat) {
        setIsCreatingChat(true);
        const { status, data } = await createChat({
          agentId: tab,
          messages,
        });

        if (status === 'failed' || !data) {
          return null;
        }

        mutate(`/api/history?agentId=${tab}`, data, {
          revalidate: false,
          populateCache: (data, history = []) => {
            return [data, ...history];
          },
        });
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

  const hasError = !!error && !isStreamInputError
  const shouldRemoveLastMessage =
  hasError && messages.at(-1)?.role === 'assistant';

  const onSubmit = useCallback(
    async (
      content = input,
      newAttachments: Array<Attachment> = attachments,
      currentAgent: string | null = currentTab,
      currentAgents = agents,
      currentTabs = tabs,
    ) => {
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

      const data = await getOrCreateChat([...messages, message], currentAgent);
      if (!data) {
        toast.error('Something went wrong, please try again!');
        return;
      }

      setInput('');
      setAttachments([]);

      if (shouldRemoveLastMessage) {
        setMessages(messages.slice(0, -1));
      }

      await append(message, {
        body: {
          id: data.id,
          modelId: selectedModelId,
          provider: selectedProvider,
        },
      });

      if (!chat) {
        router.push(`/chat/${data.id}`);
      }
    },
    [
      currentTab,
      agents,
      tabs,
      input,
      shouldRemoveLastMessage,
      attachments,
      getOrCreateChat,
      messages,
      setInput,
      append,
      selectedModelId,
      selectedProvider,
      chat,
      setMessages,
      router,
    ],
  );

  useEffect(() => {
    if (initialAgents.length > 0) {
      mutate('/api/agents', initialAgents, {
        revalidate: false,
      });
    }
  }, [initialAgents, mutate]);

  useEffect(() => {
    if (agents.length === 0 || (!chat && tabs.length === 0)) {
      return;
    }
    if (currentTab) {
      if (!tabs.includes(currentTab)) {
        setTab(null);
      }

      return;
    }
    const hasAgentForChat =
      !!id && agents.some((agent) => agent.id === chat?.agentId);
    if (chat && hasAgentForChat) {
      if (!tabs.includes(chat.agentId)) {
        addTab(chat.agentId);
      }
      setTab(chat.agentId);
    } else {
      router.push('/');
      setTab(tabs[0] || null);
    }
  }, [tabs, router, currentTab, setTab, addTab, chat, id, agents]);

  const isAssistantFirstMessageMissing =
    !!chat &&
    !isLoading &&
    messages.length === 1 &&
    messages[0]?.role === 'user';
  const currentMessages = shouldRemoveLastMessage
    ? messages.slice(0, -1)
    : messages;

  return (
    <>
      <div className="flex flex-col min-w-0 h-dvh bg-background">
        <ChatHeader
          agents={agents}
          chatId={chat?.id}
          modelId={selectedModelId}
          provider={selectedProvider}
          onChangeProvider={setProvider}
          onChangeModelId={setModelId}
          selectedVisibilityType={selectedVisibilityType}
          isReadonly={isReadonly}
          openAgentListDialog={openAgentListDialog}
          agentDialog={agentDialogState}
          changeAgentDialog={changeAgentDialog}
          changeAgentListDialog={setOpenAgentListDialog}
          onSubmit={onSubmit}
        />
        <Messages
          isBlockVisible={isBlockVisible}
          chatId={chat?.id}
          isLoading={isLoading}
          votes={votes}
          messages={currentMessages}
          setMessages={setMessages}
          reload={reloadMessage}
          isReadonly={isReadonly}
          hasError={hasError || isAssistantFirstMessageMissing}
        />
        <form className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
          {!isReadonly && (
            <MultimodalInput
              input={input}
              setInput={setInput}
              handleSubmit={onSubmit}
              isLoading={isLoading || isCreatingChat}
              stop={stop}
              attachments={attachments}
              setAttachments={setAttachments}
              setMessages={setMessages}
            />
          )}
        </form>
      </div>
      <Block
        chatId={chat?.id}
        input={input}
        setInput={setInput}
        handleSubmit={onSubmit}
        isLoading={isLoading}
        stop={stop}
        attachments={attachments}
        setAttachments={setAttachments}
        messages={currentMessages}
        setMessages={setMessages}
        reload={reloadMessage}
        votes={votes}
        isReadonly={isReadonly}
        hasError={hasError || isAssistantFirstMessageMissing}
      />
    </>
  );
}
