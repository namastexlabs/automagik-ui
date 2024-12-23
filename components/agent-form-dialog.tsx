'use client'

import { useActionState } from "react";
import Form from "next/form";
import { toast } from "sonner";
import { useSWRConfig } from "swr";

import type { Agent } from "@/lib/db/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/submit-button";
import { createAgent, type SaveAgentActionState } from "@/app/(chat)/actions";

export function AgentFormDialog({
  onSuccess,
  agent,
  isOpen,
  setOpen,
}: {
  onSuccess: (agent: Agent) => void;
  agent?: Agent | null;
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
}) {
  const { mutate } = useSWRConfig();

  const [formState, formAction] = useActionState<SaveAgentActionState, FormData>(
    async (previousState, formData) =>  {
      const toastId = toast.loading('Creating agent...');
      setOpen(false);

      const state = await createAgent(previousState, formData)
      toast.dismiss(toastId);

      if (state.status === 'failed') {
        toast.error('Unexpected error, please try again!');
      } else if (state.status === 'invalid_data') {
        toast.error('Failed validating your submission!');
      } else if (state.status === 'success' && state.data) {
        toast.success('Agent created successfully')
        mutate<Agent[], Agent>('/api/agents', state.data, {
          populateCache: (data, agents = []) => {
            return [...agents, data];
          },
          revalidate: false,
        });

        onSuccess(state.data);
      }

      return state
    },
    { status: 'idle', data: null },
  );

	return (
		<Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {agent ? `Update ${agent.agentName}` : 'New Agent'}
          </DialogTitle>
          <DialogDescription>
            Create a new agent with a system prompt
          </DialogDescription>
        </DialogHeader>
        <Form action={formAction}>
            <div className="flex flex-col gap-8 py-3">
              <div className="flex flex-col gap-4">
                <Label
                  htmlFor="agentName"
                  className="text-zinc-600 font-normal dark:text-zinc-400"
                >
                  Agent Name
                </Label>
                <Input
                  id="agentName"
                  name="agentName"
                  className="bg-muted text-md md:text-sm"
                  placeholder="Content Writer"
                  required
                  autoFocus
                  defaultValue={agent?.agentName}
                />
              </div>
              <div className="flex flex-col gap-4">
                <Label
                  htmlFor="systemPrompt"
                  className="text-zinc-600 font-normal dark:text-zinc-400"
                >
                  System Prompt
                </Label>
                <Textarea
                  id="systemPrompt"
                  name="systemPrompt"
                  className="bg-muted text-md md:text-sm md:h-[140px]"
                  placeholder="You are a useful assistant"
                  required
                  defaultValue={agent?.systemPrompt}
                />
              </div>
            </div>
            <div className="flex justify-end mt-3">
              <SubmitButton isSuccessful={formState.status === 'success'}>
                Save
              </SubmitButton>
            </div>
          </Form>
      </DialogContent>
    </Dialog>
	)
}