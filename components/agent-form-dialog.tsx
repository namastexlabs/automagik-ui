'use client';

import { useActionState, useCallback, useEffect, useId, useState } from 'react';
import Form from 'next/form';
import { toast } from 'sonner';
import { useSWRConfig } from 'swr';
import { Fullscreen } from 'lucide-react';
import { TooltipContent } from '@radix-ui/react-tooltip';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { SubmitButton } from '@/components/submit-button';
import { saveAgentAction } from '@/app/(chat)/actions';
import { ToolsCombobox } from '@/components/tools-combobox';
import { DataStatus } from '@/lib/data';
import type { AgentDTO } from '@/lib/data/agent';

import { PromptTemplate } from './prompt-template';
import { VisibilitySelector } from './visibility-selector';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { Button } from './ui/button';
import { Tooltip, TooltipTrigger } from './ui/tooltip';

export function AgentFormDialog({
  onSuccess,
  agent,
  isOpen,
  setOpen,
}: {
  onSuccess: (agent: AgentDTO) => void;
  agent?: AgentDTO | null;
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
}) {
  const formId = useId();
  const { mutate } = useSWRConfig();
  const [isCloseAttempt, setCloseAttempt] = useState(false);
  const [openPromptTemplate, setOpenPromptTemplate] = useState(false);
  const [name, setName] = useState(agent?.name || '');
  const [template, setTemplate] = useState(agent?.systemPrompt || '');
  const [visibility, setVisibility] = useState(agent?.visibility ?? 'private');
  const [selected, setSelected] = useState<string[]>(
    agent?.tools.map((tool) => tool.id) || [],
  );

  const [{ errors = {} }, formAction] = useActionState<
    Awaited<ReturnType<typeof saveAgentAction>>,
    FormData
  >(
    async (state, formData) => {
      const newState = await saveAgentAction(state, formData);

      if (newState.status === DataStatus.Success && newState.data) {
        toast.success('Agent created successfully');
        mutate<AgentDTO[], AgentDTO>('/api/agents', newState.data, {
          populateCache: (data, agents = []) => {
            const hasAgent = agents.some((agent) => agent.id === data.id);
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
        onSuccess(newState.data);
      }

      return newState;
    },
    { status: DataStatus.Success, data: null },
  );

  useEffect(() => {
    if (isOpen) {
      setName(agent?.name || '');
      setSelected(agent?.tools.map((tool) => tool.id) || []);
      setVisibility(agent?.visibility ?? 'private');
      setTemplate(agent?.systemPrompt || '');
    }
  }, [agent, isOpen]);

  const toggleTool = useCallback((toolId: string) => {
    setSelected((selected) => {
      if (selected.includes(toolId)) {
        return selected.filter((id) => id !== toolId);
      } else {
        return [...selected, toolId];
      }
    });
  }, []);

  const form = `${formId}-form`;

  return (
    <>
      <Dialog
        modal={!openPromptTemplate}
        open={isOpen}
        onOpenChange={(open) => {
          if (openPromptTemplate) {
            return;
          }

          if (!open) {
            setCloseAttempt(true);
          } else {
            setOpen(open);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between pr-6">
              {agent ? `${agent.name}` : 'New Agent'}
              <VisibilitySelector
                selectedVisibilityType={visibility}
                onChange={setVisibility}
              />
            </DialogTitle>
            <DialogDescription>
              {agent ? 'Edit' : 'Create'}{' '}
              {agent
                ? `${agent.name} agent`
                : 'Agent with a system prompt and tools'}
            </DialogDescription>
          </DialogHeader>
          <Form id={form} action={formAction}>
            {agent ? (
              <input readOnly type="hidden" name="id" value={agent.id} />
            ) : null}
            <input type="hidden" name="visibility" value={visibility} />
            <div className="flex flex-col gap-5 py-3">
              <div className="flex flex-col gap-2">
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
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                {!!errors.name && (
                  <span className="text-sm text-destructive">
                    {errors.name.join(', ')}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2 items-center">
                  <Label
                    htmlFor={`${formId}-system-prompt`}
                    className="text-zinc-600 font-normal dark:text-zinc-400"
                  >
                    System Prompt
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        className="p-1 size-6"
                        onClick={() => setOpenPromptTemplate(true)}
                      >
                        <Fullscreen />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Open fullscreen</TooltipContent>
                  </Tooltip>
                </div>
                <PromptTemplate
                  formId={form}
                  name="systemPrompt"
                  placeholder="You are a useful assistant"
                  agent={agent}
                  openDialog={openPromptTemplate}
                  setOpenDialog={setOpenPromptTemplate}
                  template={template}
                  onChange={setTemplate}
                />
                {!!errors.systemPrompt && (
                  <span className="text-sm text-destructive">
                    {errors.systemPrompt.join(', ')}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-2">
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
              <SubmitButton>Save</SubmitButton>
            </div>
          </Form>
        </DialogContent>
      </Dialog>
      <AlertDialog open={isCloseAttempt} onOpenChange={setCloseAttempt}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The filled fields can&apos;t be
              recovered.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                setCloseAttempt(false);
                setOpen(false);
              }}
              className="bg-destructive hover:bg-destructive"
            >
              Continue
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
