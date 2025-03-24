'use client';

import { useCallback } from 'react';

import { AgentListDialog } from '@/components/agent-list-dialog';
import { AgentFormDialog } from '@/components/agent-form-dialog';
import type { AgentDTO } from '@/lib/data/agent';

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
  const handleOpenAgentDialog = useCallback(
    (open: boolean, agentId?: string) =>
      open ? changeAgentDialog(open, agentId) : changeAgentDialog(false),
    [changeAgentDialog],
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
        isOpen={agentDialog.isOpen}
        setOpen={handleOpenAgentDialog}
      />
    </>
  );
}
