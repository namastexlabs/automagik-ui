'use client';

import { ModelSelector } from '@/components/model-selector';
import { SidebarToggle } from '@/components/sidebar-toggle';
import { AgentTabs } from '@/components/agent-tabs';
import {
  VisibilitySelector,
  type VisibilityType,
} from '@/components/visibility-selector';
import type { ClientAgent } from '@/lib/data';

export function ChatHeader({
  agents,
  chatId,
  selectedModelId,
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
  selectedModelId: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
  openAgentListDialog: boolean;
  agentDialog: {
    agentId: string | null;
    isOpen: boolean;
    isSubmitting: boolean;
  };
  changeAgentDialog: (isOpen: boolean, agentId?: string, isSubmitting?: boolean) => void;
  changeAgentListDialog: (isOpen: boolean) => void;
  onSubmit: (agentId?: string, agents?: ClientAgent[], tabs?: string[]) => void;
}) {
  return (
    <header className="flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-2 gap-2">
      <SidebarToggle />
      {!isReadonly && (
        <ModelSelector
          selectedModelId={selectedModelId}
          className="order-1 md:order-2"
        />
      )}
      {!isReadonly && (
        <VisibilitySelector
          chatId={chatId}
          selectedVisibilityType={selectedVisibilityType}
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
