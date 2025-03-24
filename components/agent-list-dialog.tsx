import React, { useState } from 'react';
import { CopyPlus, PlusIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useSWRConfig } from 'swr';

import { deleteAgentAction, duplicateAgentAction } from '@/app/(chat)/actions';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
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
import { useCurrentAgentTab } from '@/contexts/agent-tabs';
import { useUser } from '@/contexts/user';
import type { AgentDTO } from '@/lib/data/agent';

import { PrivateAgentActions } from './private-agent-actions';

export function AgentListDialog({
  agents,
  openAgentDialog,
  isAgentDialogOpen,
  isOpenAgentListDialog,
  openAgentListDialog,
}: {
  agents: AgentDTO[];
  isAgentDialogOpen: boolean;
  openAgentDialog: (agentId?: string) => void;
  openAgentListDialog: (isOpen: boolean) => void;
  isOpenAgentListDialog: boolean;
}) {
  const [isDuplicatingAgent, setIsDuplicatingAgent] = useState(false);
  const [agentDelete, setAgentDelete] = useState<string | null>(null);
  const [isDeletingAgent, setIsDeletingAgent] = useState(false);
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const { user } = useUser();
  const { setTab } = useCurrentAgentTab();

  const handleDelete = async (agentId: string) => {
    toast.promise(
      async () => {
        setIsDeletingAgent(true);
        const response = await deleteAgentAction(agentId);
        setIsDeletingAgent(false);

        return response;
      },
      {
        loading: 'Deleting agent...',
        success: (response) => {
          if (response.errors) {
            toast.error(
              response.errors?._errors?.[0] || 'Failed to delete agent',
            );

            return;
          }

          mutate('/api/agents', (agents: AgentDTO[] = []) => {
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
      },
    );
  };

  const handleDuplicate = (agentId: string) => {
    toast.promise(
      async () => {
        setIsDuplicatingAgent(true);
        const response = await duplicateAgentAction(agentId);
        setIsDuplicatingAgent(false);

        return response;
      },
      {
        loading: 'Duplicating agent...',
        success: (response) => {
          const { data, errors } = response;

          if (errors) {
            console.log(errors);
            toast.error(errors?._errors?.[0] || 'Failed to duplicate agent');
            return;
          }

          if (data) {
            mutate('/api/agents', (agents: AgentDTO[] = []) => [
              ...agents,
              data,
            ]);
          }

          return 'Agent duplicated successfully';
        },
        error: (error) => {
          return String(error.message);
        },
      },
    );
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
        <div className="flex flex-col gap-[12px] pt-[12px] max-h-[40vh] overflow-y-auto">
          {agents.map((agent) => (
            <Button
              key={`${agent.id}`}
              variant="ghost"
              onClick={() => {
                setTab(agent.id);
                openAgentListDialog(false);
                router.push('/');
              }}
              className="flex justify-between items-center px-2 py-1 rounded-md border hover:border-zinc-300 cursor-pointer"
            >
              <div className="flex items-center space-x-3">
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
            </Button>
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
              <AlertDialogCancel disabled={isDeletingAgent}>
                Cancel
              </AlertDialogCancel>
              <Button
                type="button"
                variant="destructive"
                onClick={() => agentDelete && handleDelete(agentDelete)}
                className="bg-destructive hover:bg-destructive"
                disabled={isDeletingAgent}
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
