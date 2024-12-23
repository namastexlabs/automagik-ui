'use client';

import { generateId, type Attachment, type Message } from 'ai';
import { useChat } from 'ai/react';
import { useCallback, useEffect, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { useWindowSize } from 'usehooks-ts';
import { toast } from 'sonner';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';

import { ChatHeader } from '@/components/chat-header';
import type { Agent, Chat as ChatType, Vote } from '@/lib/db/schema';
import { fetcher, getSelectedAgent } from '@/lib/utils';
import { createChat } from '@/app/(chat)/actions';

import { Block } from './block';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import { useBlockSelector } from '@/hooks/use-block';
import type { VisibilityType } from './visibility-selector';
import { AgentFormDialog } from './agent-form-dialog';

export function Chat({
  initialChat,
  initialAgents,
  initialMessages,
  selectedModelId,
  selectedVisibilityType,
  isReadonly,
}: {
  initialChat?: ChatType;
  initialMessages: Array<Message>;
  initialAgents: Agent[];
  selectedVisibilityType: VisibilityType;
  selectedModelId: string;
  isReadonly: boolean;
}) {
  const { mutate } = useSWRConfig();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { id } = useParams() as { id?: string };
  const { width: windowWidth = 1920, height: windowHeight = 1080 } =
    useWindowSize({ initializeWithValue: false });

  const [isOpenAgentDialog, setOpenAgentDialog] = useState(false);
  const [attachments, setAttachments] = useState<Array<Attachment>>([]);

  const { data: chat } = useSWR<ChatType>(
    id ? `/api/chat/${id}` : null,
    fetcher,
    {
      fallbackData: initialChat,
      revalidateOnMount: false
    },
  );

  const { data: votes } = useSWR<Array<Vote>>(
    chat?.id ? `/api/vote?chatId=${chat.id}` : null,
    fetcher,
  );

  const { data: agents = [] } = useSWR<Array<Agent>>(
    '/api/agents',
    fetcher,
    {
      fallbackData: initialAgents,
      revalidateOnMount: false,
    },
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
  } = useChat({
    id: chat?.id,
    initialMessages,
    experimental_throttle: 100,
    onFinish: () => {
      mutate('/api/history');
    },
  });

  const isBlockVisible = useBlockSelector((state) => state.isVisible);
  const initialAgentId = getSelectedAgent(searchParams, chat);
  const agentId = initialAgentId || agents[0]?.id || null;

  useEffect(() => {
    if (pathname !== '/' || isLoading) {
      return;
    }

    if (agentId === initialAgents[0]?.id && !initialAgentId) {
      router.push(`/?agentId=${agentId}`);
    }
  }, [agentId, initialAgentId, initialAgents, router, pathname, isLoading]);

  const changeAgentDialog = (open: boolean) => setOpenAgentDialog(open);

  const onSubmit = useCallback(
    async (currentAgentId: string | null = agentId) => {
      if (!currentAgentId) {
        changeAgentDialog(true);
        return;
      }

      const message: Message = {
          id: generateId(),
          createdAt: new Date(),
          role: 'user',
          content: input,
          experimental_attachments: attachments,
        }
      

      let data = chat || null;
      if (!data) {
        data = await createChat({
          messages: [...messages, message],
          agentId: currentAgentId,
        });

        if (!data) {
          toast.error('Something went wrong, please try again!');
          return;
        }
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
      agentId,
      chat,
      input,
      messages,
      router,
      selectedModelId,
      attachments,
      append,
      setInput,
    ]
  );

  const onSaveAgent = (agent: Agent) => {
    if (!agentId) {
      onSubmit(agent.id);
    } else {
      router.push(`/?agentId=${agent.id}`);
    }
  }

  return (
    <>
      <div className="flex flex-col min-w-0 h-dvh bg-background">
        <ChatHeader
          chatId={chat?.id}
          agents={agents}
          selectedAgentId={agentId}
          selectedModelId={selectedModelId}
          selectedVisibilityType={selectedVisibilityType}
          isReadonly={isReadonly}
          openAgentDialog={() => changeAgentDialog(true)}
        />
        <Messages
          chatId={chat?.id}
          isLoading={isLoading}
          votes={votes}
          messages={messages}
          setMessages={setMessages}
          reload={reload}
          isReadonly={isReadonly}
          isBlockVisible={isBlockVisible}
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
              messages={messages}
              setMessages={setMessages}
              append={append}
            />
          )}
        </form>
      </div>
      <Block
        chatId={id}
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
      <AgentFormDialog
        onSuccess={onSaveAgent}
        isOpen={isOpenAgentDialog}
        setOpen={changeAgentDialog}
      />
    </>
  );
}
