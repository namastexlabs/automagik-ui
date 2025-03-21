'use client';

import { FileText, Settings } from 'lucide-react';

import { ModelSelector } from '@/components/model-selector';
import { AgentTabs } from '@/components/agent-tabs';
import {
  VisibilitySelector,
  type VisibilityType,
} from '@/components/visibility-selector';
import { useChatVisibility } from '@/hooks/use-chat-visibility';
import { useChat, useChatHandlers } from '@/contexts/chat';
import type { AgentDTO } from '@/lib/data/agent';
import { Button } from '@/components/ui/button';

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
    <header className="flex sticky top-0 py-1.5 items-center px-2 md:px-2 gap-2">
      {!isReadOnly && (
        <ModelSelector
          selectedModelId={modelId}
          selectedProvider={provider}
          onChangeModelId={setModelId}
          onChangeProvider={setProvider}
        />
      )}

      <div className="flex items-center gap-1 bg-dark-gray rounded-lg h-full px-3 py-1.5 text-sm">
        <FileText size={20} />
        <span>0 tokens</span>
      </div>
      <Button variant="secondary" className="rounded-full h-auto p-3">
        <Settings size={20} />
      </Button>
      {!isReadOnly && !!chat?.id && (
        <VisibilitySelector
          selectedVisibilityType={visibilityType}
          onChange={setVisibilityType}
        />
      )}
    </header>
  );
}
