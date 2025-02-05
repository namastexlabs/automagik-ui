'use client';

import { generateId, type Attachment, type Message } from 'ai';
import { useChat } from 'ai/react';
import { useCallback, useEffect, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { toast } from 'sonner';
import { useParams, useRouter } from 'next/navigation';

import { ChatHeader } from '@/components/chat-header';
import type { Chat as ChatType, Vote } from '@/lib/db/schema';
import { fetcher } from '@/lib/utils';
import { createChat } from '@/app/(chat)/actions';

import { Block } from './block';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import type { VisibilityType } from './visibility-selector';
import { useAgentTabs, useCurrentAgentTab } from '@/contexts/agent-tabs';
import type { ClientAgent } from '@/lib/data';
import { useBlockSelector } from '@/hooks/use-block';

export function Chat({
  chat,
  initialAgents,
  initialMessages,
  selectedModelId,
  selectedVisibilityType,
  isReadonly,
}: {
  chat?: ChatType;
  initialMessages: Array<Message>;
  initialAgents: ClientAgent[];
  selectedVisibilityType: VisibilityType;
  selectedModelId: string;
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
    data: streamingData,
  } = useChat({
    id: chat?.id,
    initialMessages,
    experimental_throttle: 100,
    sendExtraMessageFields: true,
    body: {
      id: chat?.id,
      selectedChatModel: selectedModelId,
    },
  });

  const { data: agents = [] } = useSWR<ClientAgent[]>('/api/agents', fetcher, {
    fallbackData: initialAgents,
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

        return data;
      }

      return chat;
    },
    [chat, mutate],
  );

  const onSubmit = useCallback(
    async (
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
        id: generateId(),
        createdAt: new Date(),
        role: 'user',
        content: input,
        experimental_attachments: attachments,
      };

      const data = await getOrCreateChat([...messages, message], currentAgent);
      if (!data) {
        toast.error('Something went wrong, please try again!');
        return;
      }

      setInput('');
      setAttachments([]);

      await append(message, {
        body: {
          id: data.id,
          modelId: selectedModelId,
        },
      });

      if (!chat) {
        router.push(`/chat/${data.id}`);
      }
    },
    [
      tabs,
      chat,
      currentTab,
      input,
      attachments,
      setInput,
      append,
      selectedModelId,
      messages,
      router,
      agents,
      getOrCreateChat,
    ],
  );

  useEffect(() => {
    if (currentTab) {
      return;
    }

    const hasAgentForChat =
      !!id && agents.some((agent) => agent.id === chat?.agentId);
    if (chat?.agentId && hasAgentForChat && id === chat.id) {
      if (tabs.includes(chat.agentId)) {
        setTab(chat.agentId);
      }
    } else {
      router.push('/');
      setTab(tabs[0] || null);
    }
  }, [tabs, router, currentTab, setTab, addTab, chat, id, agents]);

  return (
    <>
      <div className="flex flex-col min-w-0 h-dvh bg-background">
        <ChatHeader
          agents={agents}
          chatId={chat?.id}
          selectedModelId={selectedModelId}
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
          messages={messages}
          setMessages={setMessages}
          reload={reload}
          isReadonly={isReadonly}
        />
        <form className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
          {!isReadonly && (
            <MultimodalInput
              input={input}
              setInput={setInput}
              handleSubmit={onSubmit}
              isLoading={isLoading}
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
        append={append}
        messages={messages}
        setMessages={setMessages}
        reload={reload}
        votes={votes}
        isReadonly={isReadonly}
      />
    </>
  );
}
