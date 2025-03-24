'use client';

import { useCallback } from 'react';

import { AgentListDialog } from '@/components/agent-list-dialog';
import { AgentFormDialog } from '@/components/agent-form-dialog';
import { useAgentTabs, useCurrentAgentTab } from '@/contexts/agent-tabs';
import type { AgentDTO } from '@/lib/data/agent';
import { useChatHandlers, useChatInput } from '@/contexts/chat';

export function AgentTabs({
  agents,
  openAgentListDialog,
  changeAgentListDialog,
  changeAgentDialog,
  agentDialog,
}: {
  agents: AgentDTO[];
  changeAgentDialog: (
    isOpen: boolean,
    agentId?: string,
    isSubmitting?: boolean,
  ) => void;
  openAgentListDialog: boolean;
  changeAgentListDialog: (isOpen: boolean) => void;
  agentDialog: {
    agentId: string | null;
    isOpen: boolean;
    isSubmitting: boolean;
  };
}) {
  const { addTab } = useAgentTabs();
  const { setTab } = useCurrentAgentTab();
  const { input, attachments } = useChatInput();
  const { handleSubmit } = useChatHandlers();

  const handleOpenAgentDialog = useCallback(
    (open: boolean, agentId?: string) =>
      open ? changeAgentDialog(open, agentId) : changeAgentDialog(false),
    [changeAgentDialog],
  );

  const onSaveAgent = useCallback(
    (agent: AgentDTO) => {
      if (agentDialog.isSubmitting) {
        handleSubmit(input, attachments, agent.id, [agent.id]);
      }

      if (agents.length === 0) {
        setTab(agent.id);
      }
      addTab(agent.id);
    },
    [
      agentDialog.isSubmitting,
      agents.length,
      addTab,
      handleSubmit,
      input,
      attachments,
      setTab,
    ],
  );

  return (
    <>
      <AgentListDialog
        agents={agents}
        isAgentDialogOpen={agentDialog.isOpen}
        openAgentDialog={(agentId) => changeAgentDialog(true, agentId)}
        openAgentListDialog={changeAgentListDialog}
        isOpenAgentListDialog={openAgentListDialog}
      />
      <AgentFormDialog
        agent={agents.find((agent) => agent.id === agentDialog.agentId)}
        onSuccess={onSaveAgent}
        isOpen={agentDialog.isOpen}
        setOpen={handleOpenAgentDialog}
      />
    </>
  );
}
