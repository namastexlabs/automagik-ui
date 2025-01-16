'use client';

import {
  useActionState,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
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
import { ToolsCombobox } from '@/components/tools-combobox';
import { DynamicBlocks } from './dynamic-blocks';
import type { ClientAgent } from '@/lib/data';

export function AgentFormDialog({
  onSuccess,
  agent,
  isOpen,
  setOpen,
  openAgentListDialog,
}: {
  onSuccess: (agent: ClientAgent) => void;
  agent?: ClientAgent | null;
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
  openAgentListDialog: boolean;
}) {
  const formId = useId();
  const { mutate } = useSWRConfig();
  const onSuccessRef = useRef(onSuccess);
  const [selected, setSelected] = useState<string[]>(
    agent?.tools.map((tool) => tool.id) || [],
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
      setSelected(agent?.tools.map((tool) => tool.id) || []);
    }
  }, [agent?.tools, formState]);

  useEffect(() => {
    if (formState.status === 'failed') {
      toast.error('Unexpected error, please try again!');
    } else if (formState.status === 'invalid_data') {
      toast.error('Failed validating your submission!');
    } else if (formState.status === 'success' && formState.data) {
      toast.success('Agent created successfully');
      mutate<ClientAgent[], ClientAgent>('/api/agents', formState.data, {
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

  const resetBlocks = useCallback(
    (set: (blocks: string[]) => void) => {
      if (['idle', 'failed', 'invalid_data'].includes(formState.status)) {
        set(agent?.dynamicBlocks.map(({ name }) => name) || []);
      }
    },
    [formState, agent],
  );

  const toggleTool = (toolId: string) => {
    setSelected((selected) => {
      if (selected.includes(toolId)) {
        return selected.filter((id) => id !== toolId);
      } else {
        return [...selected, toolId];
      }
    });
  };

  const form = `${formId}-form`;

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
        <Form id={form} action={formAction}>
          <input type="hidden" name="id" value={agent?.id} />
          <div className="flex flex-col gap-8 py-3">
            <div className="flex flex-col gap-4">
              <Label
                htmlFor={`${formId}-name`}
                className="text-zinc-600 font-normal dark:text-zinc-400"
              >
                Name
              </Label>
              <Input
                id={`${formId}-name`}
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
                htmlFor={`${formId}-blocks`}
                className="text-zinc-600 font-normal dark:text-zinc-400"
              >
                Blocks
              </Label>
              <DynamicBlocks formId={formId} onReset={resetBlocks} />
            </div>
            <div className="flex flex-col gap-4">
              <Label
                htmlFor={`${formId}-system-prompt`}
                className="text-zinc-600 font-normal dark:text-zinc-400"
              >
                System Prompt
              </Label>
              <Textarea
                id={`${formId}-system-prompt`}
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
              <ToolsCombobox
                formId={form}
                selected={selected}
                onChange={toggleTool}
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
  );
}
