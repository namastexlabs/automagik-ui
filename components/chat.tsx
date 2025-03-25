'use client';

import type { Message } from 'ai';
import useSWR, { SWRConfig } from 'swr';
import { useEffect } from 'react';

import type { AgentDTO } from '@/lib/data/agent';
import type { Vote } from '@/lib/db/schema';
import { ChatHeader } from '@/components/chat-header';
import { fetcher } from '@/lib/utils';
import { useBlockSelector } from '@/hooks/use-block';

import type { VisibilityType } from './visibility-selector';
import { Block } from './block';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import { ChatProvider } from './chat-provider';
import { AgentTabs } from './agent-tabs';
import { useSidebar } from './ui/sidebar';
import type { ChatDTO } from '@/lib/data/chat';

export function Chat({
  chat,
  initialAgents,
  initialMessages,
  selectedVisibilityType,
  isReadonly,
  modelId,
  provider,
}: {
  chat?: ChatDTO;
  initialMessages: Array<Message>;
  initialAgents: AgentDTO[];
  selectedVisibilityType: VisibilityType;
  modelId: string;
  provider: string;
  isReadonly: boolean;
}) {
  const { data: votes } = useSWR<Array<Vote>>(
    chat?.id ? `/api/vote?chatId=${chat.id}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
    },
  );

  const {
    openAgentDialog,
    openAgentListDialog,
    agentDialog,
    isAgentListDialogOpen,
  } = useSidebar();

  const { data: agents = [], mutate } = useSWR<AgentDTO[]>(
    '/api/agents',
    fetcher,
    {
      revalidateOnMount: false,
    },
  );

  useEffect(() => {
    if (initialAgents.length > 0) {
      mutate(initialAgents, {
        revalidate: false,
      });
    }
  }, [initialAgents, mutate]);

  const isBlockVisible = useBlockSelector((state) => state.isVisible);

  return (
    <SWRConfig
      value={{
        fallback: {
          '/api/agents': initialAgents,
        },
      }}
    >
      <ChatProvider
        initialMessages={initialMessages}
        chat={chat}
        modelId={modelId}
        provider={provider}
        isReadOnly={isReadonly}
      >
        <div className="flex flex-col min-w-0 h-dvh bg-accent bg-gradient-to-tl from-accent from-40% to-white/15">
          <ChatHeader selectedVisibilityType={selectedVisibilityType} />
          <Messages isBlockVisible={isBlockVisible} votes={votes} />
          <form className="flex mx-auto px-4 pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
            {!isReadonly && <MultimodalInput />}
          </form>
        </div>
        <Block votes={votes} />
        <AgentTabs
          agents={agents}
          openAgentListDialog={isAgentListDialogOpen}
          changeAgentListDialog={openAgentListDialog}
          changeAgentDialog={openAgentDialog}
          agentDialog={agentDialog}
        />
      </ChatProvider>
    </SWRConfig>
  );
}
