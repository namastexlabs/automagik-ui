'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import Form from 'next/form';
import { toast } from 'sonner';
import { useSWRConfig } from 'swr';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SubmitButton } from '@/components/submit-button';
import { saveAgent, type SaveAgentActionState } from '@/app/(chat)/actions';
import { ToolsCombobox } from './tools-combobox';
import type { AgentWithTools } from '@/lib/db/queries';

export function AgentFormDialog({
  onSuccess,
  agent,
  isOpen,
  setOpen,
  openAgentListDialog,
}: {
  onSuccess: (agent: AgentWithTools) => void;
  agent?: AgentWithTools | null;
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
  openAgentListDialog: boolean;
}) {
  const { mutate } = useSWRConfig();
  const onSuccessRef = useRef(onSuccess);
  const [selected, setSelected] = useState<string[]>(
    agent?.tools.map(({ tool }) => tool.id) || [],
  );

  const [formState, formAction] = useActionState<
    SaveAgentActionState,
    FormData
  >(saveAgent, { status: 'idle', data: null });

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  useEffect(() => {
    if (['idle', 'failed', 'invalid_data'].includes(formState.status)) {
      setSelected(agent?.tools.map(({ tool }) => tool.id) || []);
    }
  }, [agent?.tools, formState]);

  useEffect(() => {
    if (formState.status === 'failed') {
      toast.error('Unexpected error, please try again!');
    } else if (formState.status === 'invalid_data') {
      toast.error('Failed validating your submission!');
    } else if (formState.status === 'success' && formState.data) {
      toast.success('Agent created successfully');
      mutate<AgentWithTools[], AgentWithTools>('/api/agents', formState.data, {
        populateCache: (data, agents = []) => {
          const hasAgent = agents.find((agent) => agent.id === data.id);
          if (hasAgent) {
            return agents.map((agent) => {
              if (agent.id === data.id) {
                return data;
              }
              return agent;
            });
          }

          return [...agents, data];
        },
        revalidate: false,
      });

      setOpen(false);
      onSuccessRef.current(formState.data);
    }
  }, [formState, setOpen, mutate, setSelected, agent]);

  const toggleTool = (toolId: string) => {
    setSelected((selected) => {
      if (selected.includes(toolId)) {
        return selected.filter((id) => id !== toolId);
      } else {
        return [...selected, toolId];
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent hideOverlay={openAgentListDialog}>
        <DialogHeader>
          <DialogTitle>
            {agent ? `Update ${agent.name}` : 'New Agent'}
          </DialogTitle>
          <DialogDescription>
            {agent
              ? 'Update an existing agent'
              : 'Create a new agent with a system prompt'}
          </DialogDescription>
        </DialogHeader>
        <Form id="agent-form" action={formAction}>
          <input type="hidden" name="id" value={agent?.id} />
          <div className="flex flex-col gap-8 py-3">
            <div className="flex flex-col gap-4">
              <Label
                htmlFor="name"
                className="text-zinc-600 font-normal dark:text-zinc-400"
              >
                Agent Name
              </Label>
              <Input
                id="name"
                name="name"
                className="bg-muted text-md md:text-sm"
                placeholder="Content Writer"
                required
                autoFocus
                defaultValue={agent?.name}
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
            <div className="flex flex-col gap-4">
              <Label className="text-zinc-600 font-normal dark:text-zinc-400">
                Tools
              </Label>
              <ToolsCombobox selected={selected} onChange={toggleTool} />
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
  );
}
