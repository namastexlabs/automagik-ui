'use client';

import type { Message } from 'ai';
import { useCallback, useEffect, useState } from 'react';
import useSWR, { SWRConfig, useSWRConfig } from 'swr';
import { useParams, useRouter } from 'next/navigation';

import type { AgentDTO } from '@/lib/data/agent';
import type { Chat as ChatType, Vote } from '@/lib/db/schema';
import { ChatHeader } from '@/components/chat-header';
import { fetcher } from '@/lib/utils';
import { useAgentTabs, useCurrentAgentTab } from '@/contexts/agent-tabs';
import { useBlockSelector } from '@/hooks/use-block';

import type { VisibilityType } from './visibility-selector';
import { Block } from './block';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import { ChatProvider } from './chat-provider';

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
  initialAgents: AgentDTO[];
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
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
    },
  );
  const { data: agents = [] } = useSWR<AgentDTO[]>('/api/agents', fetcher, {
    revalidateOnMount: false,
  });

  const isBlockVisible = useBlockSelector((state) => state.isVisible);
  const [openAgentListDialog, setOpenAgentListDialog] = useState(false);
  const [agentDialogState, setAgentDialogState] = useState<{
    agentId: string | null;
    isOpen: boolean;
    isSubmitting: boolean;
  }>({ isOpen: false, agentId: null, isSubmitting: false });

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

    if (isReadonly) {
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
  }, [tabs, router, currentTab, setTab, addTab, chat, id, agents, isReadonly]);

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
        setOpenAgentListDialog={setOpenAgentListDialog}
        setAgentDialogState={setAgentDialogState}
      >
        <div className="flex flex-col min-w-0 h-dvh bg-accent bg-gradient-to-tl from-accent from-40% to-white/15">
          <Messages isBlockVisible={isBlockVisible} votes={votes} />
          <form className="flex mx-auto px-4 pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
            {!isReadonly && <MultimodalInput agents={agents} />}
          </form>
        </div>
        <Block agents={agents} votes={votes} />
      </ChatProvider>
    </SWRConfig>
  );
}
