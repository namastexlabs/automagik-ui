'use client';

import { memo } from 'react';
import { useRouter } from 'next/navigation';
import { useWindowSize } from 'usehooks-ts';

import type { Agent } from '@/lib/db/schema';
import { ModelSelector } from '@/components/model-selector';
import { SidebarToggle } from '@/components/sidebar-toggle';
import { Button } from '@/components/ui/button';
import { PlusIcon } from './icons';
import { useSidebar } from './ui/sidebar';
import { AgentTabs } from './agent-tabs';
import { VisibilitySelector, type VisibilityType } from './visibility-selector';

function PureChatHeader({
  chatId,
  agents,
  selectedAgentId,
  selectedModelId,
  selectedVisibilityType,
  isReadonly,
  openAgentDialog,
}: {
  chatId?: string;
  agents: Agent[];
  selectedAgentId?: string | null;
  selectedModelId: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
  openAgentDialog: () => void;
}) {
  const router = useRouter();
  const { open } = useSidebar();

  const { width: windowWidth } = useWindowSize();

  return (
    <header className="flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-2 gap-2">
      <SidebarToggle />
      {(!open || windowWidth < 768) && (
        <Button
          variant="outline"
          className="order-2 md:order-1 md:px-2 px-2 md:h-fit ml-auto md:ml-0"
          onClick={() => {
            router.push(`/${selectedAgentId ? `?agentId=${selectedAgentId}` : ''}`);
            router.refresh();
          }}
        >
          New Chat <PlusIcon />
          <span className="md:sr-only">New Chat</span>
        </Button>
      )}
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
        selectedAgentId={selectedAgentId}
        openAgentDialog={openAgentDialog}
        agents={agents}
      />
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
  if (prevProps.selectedModelId !== nextProps.selectedModelId) return false;
  if (prevProps.selectedAgentId !== nextProps.selectedAgentId) return false;

  return true;
});
