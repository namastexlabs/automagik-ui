import React, { useMemo, useState } from 'react';
import { EditIcon, PlusIcon, TrashIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useSWRConfig } from 'swr';

import { deleteAgent } from '@/app/(chat)/actions';
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
        if (agentId === currentTab) {
          if (tabs.length === 1) {
            setTab(null);
          } else {
            setTab(tabs[0] || null);
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

  const handleCheckboxChange = (agentId: string, isChecked: boolean) => {
    if (isChecked && tabs.length === 0) {
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
        <div className="flex flex-col gap-3 pt-3 max-h-[40vh] overflow-y-auto">
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
                <Label className="w-80 truncate cursor-pointer">
                  {agent.name}
                </Label>
              </div>
              {agent.userId === user.id && (
                <div className="flex item-center space-x-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        className="size-8 p-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          openAgentDialog(agent.id);
                        }}
                      >
                        <EditIcon />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Edit Agent</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        className="hover:bg-destructive size-8 p-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAgentDelete(agent.id);
                        }}
                      >
                        <TrashIcon />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Delete Agent</TooltipContent>
                  </Tooltip>
                </div>
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
