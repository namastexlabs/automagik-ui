'use client';

import type { Attachment, Message } from 'ai';
import { useChat } from 'ai/react';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import useSWR, { SWRConfig, useSWRConfig } from 'swr';

import { ChatHeader } from '@/components/chat-header';
import type { Agent, Vote } from '@/lib/db/schema';
import { fetcher } from '@/lib/utils';

import { Block } from './block';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import { VisibilityType } from './visibility-selector';
import { useBlockSelector } from '@/hooks/use-block';

export function Chat({
  id,
  agents,
  initialMessages,
  selectedModelId,
  selectedVisibilityType,
  isReadonly,
}: {
  id: string;
  initialMessages: Array<Message>;
  agents: Agent[];
  selectedVisibilityType: VisibilityType;
  selectedModelId: string;
  isReadonly: boolean;
}) {
  const searchParams = useSearchParams();
  const { mutate } = useSWRConfig();

  const agentId = searchParams.get('agentId') || agents[0]?.id || null;

  const {
    messages,
    setMessages,
    handleSubmit,
    input,
    setInput,
    append,
    isLoading,
    stop,
    reload,
  } = useChat({
    id,
    body: { id, modelId: selectedModelId, agentId },
    initialMessages,
    experimental_throttle: 100,
    onFinish: () => {
      mutate('/api/history');
    },
  });

  const { data: votes } = useSWR<Array<Vote>>(
    `/api/vote?chatId=${id}`,
    fetcher,
  );

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const isBlockVisible = useBlockSelector((state) => state.isVisible);

  return (
    <SWRConfig
      value={{
        fallback: {
          '/api/agents': agents,
        },
      }}
    >
      <div className="flex flex-col min-w-0 h-dvh bg-background">
        <ChatHeader
          chatId={id}
          selectedAgentId={agentId}
          selectedModelId={selectedModelId}
          selectedVisibilityType={selectedVisibilityType}
          isReadonly={isReadonly}
        />
        <Messages
          chatId={id}
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
              chatId={id}
              input={input}
              setInput={setInput}
              handleSubmit={handleSubmit}
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
        handleSubmit={handleSubmit}
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
    </SWRConfig>
  );
}
