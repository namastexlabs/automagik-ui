'use client'

import { useState } from "react";
import Form from "next/form";
import { DialogTrigger } from "@radix-ui/react-dialog";

import { PlusIcon } from "@/components/icons";
import { Agent } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/submit-button";

export function AgentFormDialog({ agent, formAction, isSuccessful }: {
  isSuccessful: boolean;
  agent?: Agent | null;
  formAction: (payload: FormData) => void;
}) {  
	const [open, setOpen] = useState(false);

  const onSubmit = (formData: FormData) => {
    setOpen(false);
    formAction(formData);
  };

	return (
		<Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              type="button"
              className="relative ml-2 p-2 h-fit"
            >
              <PlusIcon />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>New Agent</TooltipContent>
      </Tooltip>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {agent ? `Update ${agent.agentName}` : 'New Agent'}
          </DialogTitle>
          <DialogDescription>
            Create a new agent with a system prompt
          </DialogDescription>
        </DialogHeader>
        <Form action={onSubmit}>
            <div className="flex flex-col gap-8 py-3">
              <div className="flex flex-col gap-4">
                <Label htmlFor="agentName" className="text-zinc-600 font-normal dark:text-zinc-400">
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
                <Label className="text-zinc-600 font-normal dark:text-zinc-400">
                  System Prompt
                </Label>
                <Textarea
                  id="systemPrompt"
                  name="systemPrompt"
                  className="bg-muted text-md md:text-sm md:h-[150px]"
                  placeholder="You are a useful assistant"
                  required
                  defaultValue={agent?.systemPrompt}
                />
              </div>
            </div>
            <SubmitButton isSuccessful={isSuccessful}>Save</SubmitButton>
          </Form>
      </DialogContent>
    </Dialog>
	)
}