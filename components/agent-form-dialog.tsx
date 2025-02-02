'use client'

import { useActionState, useEffect, useRef } from "react";
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
  openAgentListDialog,
}: {
  onSuccess: (agent: Agent) => void;
  agent?: Agent | null;
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
  openAgentListDialog: boolean;
}) {
  const { mutate } = useSWRConfig();
  const onSuccessRef = useRef(onSuccess);

  const [formState, formAction] = useActionState<SaveAgentActionState, FormData>(
    createAgent,
    { status: 'idle', data: null },
  );

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  useEffect(() => {
    if (formState.status === 'failed') {
      toast.error('Unexpected error, please try again!');
    } else if (formState.status === 'invalid_data') {
      toast.error('Failed validating your submission!');
    } else if (formState.status === 'success' && formState.data) {
      toast.success('Agent created successfully')
      mutate<Agent[], Agent>('/api/agents', formState.data, {
        populateCache: (data, agents = []) => {
          return [...agents, data];
        },
        revalidate: false,
      });

      setOpen(false);
      onSuccessRef.current(formState.data);
    }
  }, [formState, setOpen, mutate]);

	return (
		<Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent hideOverlay={openAgentListDialog}>
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