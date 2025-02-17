import React, { useMemo, useState } from 'react';
import { CopyPlus, PlusIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useSWRConfig } from 'swr';

import { deleteAgent, duplicateAgent } from '@/app/(chat)/actions';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { useAgentTabs, useCurrentAgentTab } from '@/contexts/agent-tabs';
import { useUser } from '@/contexts/user';
import type { ClientAgent } from '@/lib/data';

import { PrivateAgentActions } from './private-agent-actions';

export function AgentListDialog({
  agents,
  openAgentDialog,
  isAgentDialogOpen,
  isOpenAgentListDialog,
  openAgentListDialog,
}: {
  agents: ClientAgent[];
  isAgentDialogOpen: boolean;
  openAgentDialog: (agentId?: string) => void;
  openAgentListDialog: (isOpen: boolean) => void;
  isOpenAgentListDialog: boolean;
}) {
  const [isDuplicatingAgent, setIsDuplicatingAgent] = useState(false);
  const [agentDelete, setAgentDelete] = useState<string | null>(null);
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const { tabs, removeTab, toggleTab } = useAgentTabs();
  const { currentTab, setTab } = useCurrentAgentTab();
  const { user } = useUser();

  const sortedAgents = useMemo(
    () =>
      agents.toSorted((a, b) => {
        const tabIndexA = tabs.indexOf(a.id);
        const tabIndexB = tabs.indexOf(b.id);

        if (tabIndexA === -1 && tabIndexB === -1) {
          if (a.userId !== user.id) {
            return 1;
          }
          if (b.userId !== user.id) {
            return -1;
          }
        }

        if (tabIndexA === -1) {
          return 1;
        }

        if (tabIndexB === -1) {
          return -1;
        }

        if (a.userId !== user.id) {
          return 1;
        }

        if (b.userId !== user.id) {
          return -1;
        }

        return tabIndexA - tabIndexB;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [agents, isOpenAgentListDialog],
  );

  const handleDelete = async (agentId: string) => {
    toast.promise(deleteAgent({ id: agentId }), {
      loading: 'Deleting agent...',
      success: () => {
        const currentIndex = tabs.indexOf(agentId);
        removeTab(agentId);
        if (agentId === currentTab) {
          router.push('/');
    
          if (tabs.length > 1) {
            setTab(tabs[currentIndex === 0 ? 1 : currentIndex - 1]);
          }
        }

        removeTab(agentId);
        mutate('/api/agents', (agents: ClientAgent[] = []) => {
          const newAgents = agents.filter((agent) => agent.id !== agentId);

          if (newAgents.length === 0) {
            router.push('/');
            openAgentListDialog(false);
          }

          return newAgents;
        });

        setAgentDelete(null);
        return 'Agent deleted successfully';
      },
      error: 'Failed to delete agent',
    });
  };

  const handleDuplicate = (agentId: string) => {
    toast.promise(async () => {
      setIsDuplicatingAgent(true);
      try {
        const { status, data } = await duplicateAgent({ id: agentId });

        if (status === 'failed') {
          throw new Error('Failed to duplicate agent');
        }

        if (status === 'exists') {
          throw new Error('Agent with the same name already exists');
        }

        return data;
      } finally {
        setIsDuplicatingAgent(false);
      }
    }, {
      loading: 'Duplicating agent...',
      success: (data) => {
        if (data) {
          mutate('/api/agents', (agents: ClientAgent[] = []) => [
            ...agents,
            data,
          ]);
        }
        return 'Agent duplicated successfully';
      },
      error: (error) => {
        return String(error.message);
      },
    });
  };

  const handleCheckboxChange = (agentId: string, isChecked: boolean) => {
    console.log(isChecked, currentTab, tabs);
    if (isChecked && (!currentTab || !tabs.includes(currentTab))) {
      setTab(agentId);
    }

    toggleTab(agentId);
  };

  return (
    <Dialog
      modal={!isAgentDialogOpen}
      open={isOpenAgentListDialog}
      onOpenChange={(open) => {
        if (!open && isAgentDialogOpen) {
          return;
        }

        if (!open && currentTab && !tabs.includes(currentTab)) {
          router.push('/');
          setTab(tabs[0] || null);
        }

        openAgentListDialog(open);
      }}
    >
      <DialogContent className="w-[600px]">
        <DialogHeader>
          <DialogTitle>Agents</DialogTitle>
          <DialogDescription>
            Select agents to chat with or create a new one
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-[12px] pt-[12px] max-h-[40vh] overflow-y-auto">
          {sortedAgents.map((agent) => (
            // biome-ignore lint/a11y/useKeyWithClickEvents: This is already interactive with the checkbox
            // biome-ignore lint/nursery/noStaticElementInteractions: This is already interactive with the checkbox
            <div
              key={`${agent.id} ${tabs.includes(agent.id)}`}
              onClick={() =>
                tabs.includes(agent.id)
                  ? handleCheckboxChange(agent.id, false)
                  : handleCheckboxChange(agent.id, true)
              }
              className="flex justify-between items-center px-2 py-1 rounded-md border hover:border-zinc-300 cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <Checkbox
                  checked={tabs.includes(agent.id)}
                  className="size-6"
                />
                <Label className="w-[280px] truncate cursor-pointer">
                  {agent.name}
                </Label>
              </div>
              {agent.userId === user.id ? (
                <PrivateAgentActions
                  openAgentDialog={openAgentDialog}
                  setAgentDelete={setAgentDelete}
                  agent={agent}
                />
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      className="size-[48px] p-1"
                      disabled={isDuplicatingAgent}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicate(agent.id);
                      }}
                    >
                      <CopyPlus />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Duplicate Agent</TooltipContent>
                </Tooltip>
              )}
            </div>
          ))}
        </div>
        <Button
          variant="outline"
          type="button"
          onClick={() => openAgentDialog()}
          className="flex items-center justify-center w-full mt-1 space-x-2"
        >
          New Agent
          <PlusIcon />
        </Button>
        <DialogFooter>
          <DialogClose asChild>
            <Button
              variant="outline"
              type="button"
              className="mt-4"
              onClick={() => openAgentListDialog(false)}
            >
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
        <AlertDialog
          open={agentDelete !== null}
          onOpenChange={(open) => {
            if (!open) {
              setAgentDelete(null);
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your
                agent and remove its data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <Button
                type="button"
                variant="destructive"
                onClick={() => agentDelete && handleDelete(agentDelete)}
                className="bg-destructive hover:bg-destructive"
              >
                Continue
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
