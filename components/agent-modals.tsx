'use client';

import { useCallback } from 'react';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';

import { AgentListDialog } from '@/components/agent-list-dialog';
import { AgentFormDialog } from '@/components/agent-form-dialog';
import { fetcher } from '@/lib/utils';
import type { AgentDTO } from '@/lib/data/agent';
import { useSidebar } from '@/components/ui/sidebar';

export function AgentModals() {
  const {
    openAgentDialog,
    openAgentListDialog,
    agentDialog,
    isAgentListDialogOpen,
  } = useSidebar();
  const router = useRouter();
  const {
    data: agents = [],
    mutate,
    isLoading,
  } = useSWR<AgentDTO[]>('/api/agents', fetcher, {
    revalidateOnMount: false,
  });
  const handleOpenAgentDialog = useCallback(
    (open: boolean, agentId?: string) =>
      open ? openAgentDialog(open, agentId) : openAgentDialog(false),
    [openAgentDialog],
  );

  const handleRemoveAgent = useCallback(
    (agentId: string) => {
      mutate((agents = []) => {
        const newAgents = agents.filter((agent) => agent.id !== agentId);

    if (newAgents.length === 0) {
      router.push('/');
      openAgentListDialog(false);
    }

        return newAgents;
      });
    },
    [mutate, openAgentListDialog, router],
  );

  const handleSaveAgent = useCallback(
    (agent: AgentDTO) => {
      mutate((agents = []) => [...agents, agent]);
    },
    [mutate],
  );

  return (
    <>
      <AgentListDialog
        agents={agents}
        isLoading={isLoading}
        onRemoveAgent={handleRemoveAgent}
        onSaveAgent={handleSaveAgent}
        isAgentDialogOpen={agentDialog.isOpen}
        openAgentDialog={(agentId) => openAgentDialog(true, agentId)}
        openAgentListDialog={openAgentListDialog}
        isOpenAgentListDialog={isAgentListDialogOpen}
      />
      <AgentFormDialog
        agent={agents.find((agent) => agent.id === agentDialog.agentId)}
        isOpen={agentDialog.isOpen}
        setOpen={handleOpenAgentDialog}
      />
    </>
  );
}
