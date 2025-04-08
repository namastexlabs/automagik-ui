'use client';

import { useEffect } from 'react';
import type { Message } from 'ai';
import useSWR from 'swr';
import type { Vote } from '@/lib/db/schema';
import { ChatHeader } from '@/components/chat-header';
import { fetcher } from '@/lib/utils';
import { useBlockSelector } from '@/hooks/use-block';

import { ChatProvider } from './chat-provider';
import type { ChatDTO } from '@/lib/data/chat';
import type { AgentDTO } from '@/lib/data/agent';
import { useCurrentAgent } from '@/hooks/use-current-agent';
import { Block } from '@/components/block';

import { Messages } from './messages';
import type { VisibilityType } from './visibility-selector';
import { MultimodalInput } from './multimodal-input';

export function Chat({
  chat,
  initialMessages,
  selectedVisibilityType,
  isReadonly,
  modelId,
  provider,
  initialAgent,
}: {
  chat?: ChatDTO;
  initialMessages: Array<Message>;
  selectedVisibilityType: VisibilityType;
  modelId: string;
  provider: string;
  isReadonly: boolean;
  initialAgent?: AgentDTO | null;
}) {
  const { updateAgent } = useCurrentAgent();
  const currentAgent = chat?.agent || initialAgent;
  const { data: votes } = useSWR<Array<Vote>>(
    chat?.id ? `/api/vote?chatId=${chat.id}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
    },
  );

  const isBlockVisible = useBlockSelector((state) => state.isVisible);

  useEffect(() => {
    updateAgent(currentAgent || null);
  }, [currentAgent, updateAgent]);

  return (
    <ChatProvider
      initialMessages={initialMessages}
      chat={chat}
      modelId={modelId}
      provider={provider}
      isReadOnly={isReadonly}
    >
      <div className="flex flex-col min-w-0 h-dvh bg-black-white-gradient">
        <ChatHeader selectedVisibilityType={selectedVisibilityType} />
        <Messages isBlockVisible={isBlockVisible} votes={votes} />
        <form className="flex mx-auto px-4 pb-4 md:pb-6 gap-2 w-full md:max-w-4xl">
          {!isReadonly && <MultimodalInput />}
        </form>
      </div>
      <Block votes={votes} />
    </ChatProvider>
  );
}
