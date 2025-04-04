'use client';

import { Trash } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import { useSWRConfig } from 'swr';
import { useRouter } from 'next/navigation';

import { deleteAgentAction } from '@/app/(chat)/actions';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogDescription,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import type { AgentDTO, AgentWithMessagesDTO } from '@/lib/data/agent';

export function AgentDeleteDialog({ agentId }: { agentId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeletingAgent, setIsDeletingAgent] = useState(false);
  const { mutate } = useSWRConfig();
  const router = useRouter();

  const handleDelete = async () => {
    toast.promise(
      async () => {
        setIsDeletingAgent(true);
        const response = await deleteAgentAction(agentId);
        setIsDeletingAgent(false);
        router.push('/chat');

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
          mutate<AgentDTO[]>('/api/agents', (agents = []) => {
            return agents.filter((agent) => agent.id !== agentId);
          });
          mutate<AgentWithMessagesDTO[]>('/api/agents/recent', (agents = []) => {
            return agents.filter((agent) => agent.id !== agentId);
          });

          return 'Agent deleted successfully';
        },
      },
    );
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        className="flex items-center p-0 bg-transparent text-accent-magenta hover:bg-transparent hover:text-accent-magenta gap-2"
        onClick={() => setIsOpen(true)}
      >
        <Trash className="size-4" />
        Delete agent
      </Button>
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
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
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive"
              disabled={isDeletingAgent}
            >
              Continue
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
