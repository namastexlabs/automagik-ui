'use client'

import { useActionState, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import useSWR from "swr";
import { XIcon } from "lucide-react";

import { Agent } from "@/lib/db/schema";
import { cn, fetcher } from "@/lib/utils";
import { AgentFormDialog } from "@/components/agent-form-dialog";
import { Button, buttonVariants } from "@/components/ui/button"
import { SaveAgentActionState, createAgent, deleteAgent } from "@/app/(chat)/actions";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function AgentTabs({ selectedAgentId }: { selectedAgentId?: string | null }) {
  const [isLoadingDelete, setLoadingDelete] = useState(false);
  const [agentDelete, setAgentDelete] = useState<string | null>(null);
  const { data: agents = [], mutate } = useSWR<Array<Agent>>('/api/agents', fetcher, {
    revalidateOnMount: false,
    revalidateOnFocus: false,
  });

  const [formState, formAction] = useActionState<SaveAgentActionState, FormData>(
    async (previousState, formData) =>  {
      const state = await createAgent(previousState, formData)

      if (state.status === 'failed') {
        toast.error('Invalid credentials!');
      } else if (state.status === 'invalid_data') {
        toast.error('Failed validating your submission!');
      } else if (state.status === 'success') {
        toast.success('Agent created successfully')
        mutate([...agents, state.data!]);
      }

      return state
    },
    { status: 'idle', data: null },
  );

  const deleteAction = async (id: string) => {
    setLoadingDelete(true);
    try {
      await deleteAgent({ id: id });
      mutate(agents.filter(item => item.id !== id));
      setAgentDelete(null)
  
      if (selectedAgentId === id) {
        window.history.replaceState({}, '', window.location.pathname);
      }
      toast.success('Agent deleted successfully');
    } finally {
      setLoadingDelete(false);
    }
  }

  const selectedStyle = (id: string) => (
    selectedAgentId === id ? 'bg-accent rounded-lg rounded-b-none z-0 h-[34px]' : ''
  );

  return (
    <div className="flex order-4 items-center w-full overflow-x-auto">
      <div className="flex px-3 py-1 gap-1.5 items-center max-w-[61vw]">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className={cn(`${buttonVariants({ variant: 'ghost' })} group relative flex p-0 shrink-0 w-[180px] h-[30px] z-10 bg-background text-accent-foreground rounded-2xl ${selectedStyle(agent.id)}`)}
          >
            <Link
              href={{ query: { agentId: agent.id } }}
              className="flex text-ellipsis overflow-hidden flex-1 pl-3 h-full items-center"
            >
              {agent.agentName}
            </Link>
            <AlertDialog
              open={agentDelete === agent.id}
              onOpenChange={(value) => value ? setAgentDelete(agent.id) : setAgentDelete(null)}
            >
              <AlertDialogTrigger asChild>
                  <Button
                  type="button"
                  variant="ghost"
                  className={`items-center w-5 h-5 rounded-full p-0 ml-auto mr-3 hover:bg-destructive ${agent.id === selectedAgentId ? 'inline-flex' : 'hidden group-hover:inline-flex'}`}
                >
                  <XIcon />
                </Button>
              </AlertDialogTrigger>
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
                    onClick={() => deleteAction(agent.id)}
                    className="bg-destructive hover:bg-destructive"
                  >
                    {isLoadingDelete ? 'Deleting...' : 'Continue'}
                  </Button>
              </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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
      <AgentFormDialog
        isSuccessful={formState.status === 'success'}
        formAction={formAction}
      />
    </div>
  )
}
