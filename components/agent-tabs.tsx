'use client'

import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { useSWRConfig } from "swr";
import { XIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button"
import { deleteAgent } from "@/app/(chat)/actions";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PlusIcon } from "@/components/icons";
import type { Agent } from "@/lib/db/schema";
import { useRouter } from "next/navigation";

export function AgentTabs({
  agents,
  selectedAgentId,
  openAgentDialog,
}: {
  agents: Agent[],
  selectedAgentId?: string | null,
  openAgentDialog: () => void,
}) {
  const router = useRouter();
  const [agentDelete, setAgentDelete] = useState<string | null>(null);
  const { mutate } = useSWRConfig();

  const deleteAction = async () => {
    if (!agentDelete) {
      toast.error('not sure how you got here. But you must leave sir');
      return;
    }

    toast.promise(deleteAgent({ id: agentDelete }), {
      loading: 'Deleting agent...',
      success: () => {
        mutate('/api/agents', (agents: Agent[] = []) => {
          return agents.filter((agent) => agent.id !== agentDelete);
        });

        setAgentDelete(null);
        if (agentDelete === selectedAgentId) {
          router.replace('/');
        }

        return 'Agent deleted successfully';
      },
      error: 'Failed to delete agent',
    })
  }

  const selectedStyle = (id: string) => (
    selectedAgentId === id ? 'bg-accent rounded-lg rounded-b-none z-0 h-[34px]' : ''
  );

  return (
    <div className="flex order-4 items-center w-full overflow-x-auto">
      {agents.length > 0 && (
        <div className="flex px-3 py-1 gap-1.5 items-center max-w-[61vw]">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className={cn(`${buttonVariants({ variant: 'ghost' })} group relative flex p-0 shrink-0 w-[180px] h-[30px] z-10 bg-background text-accent-foreground rounded-2xl ${selectedStyle(agent.id)}`)}
            >
              <Link
                href={{ pathname: '/', query: { agentId: agent.id } }}
                className="flex text-ellipsis overflow-hidden flex-1 pl-3 h-full items-center"
              >
                {agent.agentName}
              </Link>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    className={`items-center size-5 rounded-full p-0 ml-auto mr-3 hover:bg-destructive ${agent.id === selectedAgentId ? 'inline-flex' : 'hidden group-hover:inline-flex'}`}
                    onClick={() => setAgentDelete(agent.id)}
                  >
                    <XIcon />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete {agent.agentName}</TooltipContent>
              </Tooltip>
              {agent.id === selectedAgentId && (
                <>
                  <span className="absolute bg-accent -left-5 w-5 h-full -z-10" />
                  <span className="absolute bg-background -left-5 w-5 h-full rounded-br-[14px]" />
                  <span className="absolute bg-accent -right-5 w-5 h-full -z-10" />
                  <span className="absolute bg-background -right-5 w-5 h-full rounded-bl-[14px]" />
                </>
              )}
            </div>
          ))}
        </div>
      )}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            type="button"
            className={`relative p-2 h-fit ${agents.length === 0 ? '' : 'ml-2'}`}
            onClick={openAgentDialog}
          >
            {agents.length === 0 && 'New Agent '}<PlusIcon />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Add a new agent</TooltipContent>
      </Tooltip>
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
              account and remove your data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              onClick={() => deleteAction()}
              className="bg-destructive hover:bg-destructive"
            >
              Continue
            </Button>
        </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
