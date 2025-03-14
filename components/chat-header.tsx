'use client';

import { ModelSelector } from '@/components/model-selector';
import { SidebarToggle } from '@/components/sidebar-toggle';
import { AgentTabs } from '@/components/agent-tabs';
import {
  VisibilitySelector,
  type VisibilityType,
} from '@/components/visibility-selector';
import { useChatVisibility } from '@/hooks/use-chat-visibility';
import { useChat, useChatHandlers } from '@/contexts/chat';
import type { AgentDTO } from '@/lib/data/agent';

export function ChatHeader({
  agents,
  selectedVisibilityType,
  agentDialog,
  changeAgentDialog,
  openAgentListDialog,
  changeAgentListDialog,
}: {
  agents: AgentDTO[];
  selectedVisibilityType: VisibilityType;
  openAgentListDialog: boolean;
  agentDialog: {
    agentId: string | null;
    isOpen: boolean;
    isSubmitting: boolean;
  };
  changeAgentDialog: (
    isOpen: boolean,
    agentId?: string,
    isSubmitting?: boolean,
  ) => void;
  changeAgentListDialog: (isOpen: boolean) => void;
}) {
  const { chat, isReadOnly, modelId, provider } = useChat();
  const { setModelId, setProvider, handleSubmit } = useChatHandlers();
  const { visibilityType, setVisibilityType } = useChatVisibility({
    chatId: chat?.id,
    initialVisibility: selectedVisibilityType,
  });

  return (
    <header className="flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-2 gap-2">
      <SidebarToggle />
      {!isReadOnly && (
        <ModelSelector
          selectedModelId={modelId}
          selectedProvider={provider}
          onChangeModelId={setModelId}
          onChangeProvider={setProvider}
          className="order-1 md:order-2"
        />
      )}
      {!isReadOnly && !!chat?.id && (
        <VisibilitySelector
          selectedVisibilityType={visibilityType}
          onChange={setVisibilityType}
          className="order-1 md:order-3"
        />
      )}
      <AgentTabs
        agents={agents}
        agentDialog={agentDialog}
        changeAgentDialog={changeAgentDialog}
        onSubmit={handleSubmit}
        openAgentListDialog={openAgentListDialog}
        changeAgentListDialog={changeAgentListDialog}
      />
    </header>
  );
}
