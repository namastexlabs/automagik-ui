'use client';

import type { Attachment } from 'ai';

import { ModelSelector } from '@/components/model-selector';
import { SidebarToggle } from '@/components/sidebar-toggle';
import { AgentTabs } from '@/components/agent-tabs';
import {
  VisibilitySelector,
  type VisibilityType,
} from '@/components/visibility-selector';
import type { ClientAgent } from '@/lib/data';
import { useChatVisibility } from '@/hooks/use-chat-visibility';

export function ChatHeader({
  agents,
  chatId,
  modelId,
  provider,
  onChangeProvider,
  onChangeModelId,
  selectedVisibilityType,
  isReadonly,
  agentDialog,
  changeAgentDialog,
  openAgentListDialog,
  changeAgentListDialog,
  onSubmit,
}: {
  agents: ClientAgent[];
  chatId?: string;
  modelId: string;
  provider: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
  openAgentListDialog: boolean;
  agentDialog: {
    agentId: string | null;
    isOpen: boolean;
    isSubmitting: boolean;
  };
  onChangeProvider: (provider: string) => void;
  onChangeModelId: (modelId: string) => void;
  changeAgentDialog: (
    isOpen: boolean,
    agentId?: string,
    isSubmitting?: boolean,
  ) => void;
  changeAgentListDialog: (isOpen: boolean) => void;
  onSubmit: (
    content?: string,
    attachments?: Attachment[],
    agentId?: string,
    agents?: ClientAgent[],
    tabs?: string[],
  ) => void;
}) {
  const { visibilityType, setVisibilityType } = useChatVisibility({
    chatId,
    initialVisibility: selectedVisibilityType,
  });

  return (
    <header className="flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-2 gap-2">
      <SidebarToggle />
      {!isReadonly && (
        <ModelSelector
          selectedModelId={modelId}
          selectedProvider={provider}
          onChangeModelId={onChangeModelId}
          onChangeProvider={onChangeProvider}
          className="order-1 md:order-2"
        />
      )}
      {!isReadonly && !!chatId && (
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
        onSubmit={onSubmit}
        openAgentListDialog={openAgentListDialog}
        changeAgentListDialog={changeAgentListDialog}
      />
    </header>
  );
}
