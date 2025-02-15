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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { SubmitButton } from '@/components/submit-button';
import { saveAgent } from '@/app/(chat)/actions';
import { ToolsCombobox } from '@/components/tools-combobox';
import type { ClientAgent } from '@/lib/data';
import type { ActionStateData } from '@/app/types';

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
import { Fullscreen } from 'lucide-react';


export function AgentFormDialog({
  onSuccess,
  agent,
  isOpen,
  setOpen,
}: {
  onSuccess: (agent: ClientAgent) => void;
  agent?: ClientAgent | null;
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
}) {
  const formId = useId();
  const { mutate } = useSWRConfig();
  const onSuccessRef = useRef(onSuccess);
  const [isCloseAttempt, setCloseAttempt] = useState(false);
  const [openPromptTemplate, setOpenPromptTemplate] = useState(false);
  const [visibility, setVisibility] = useState(agent?.visibility ?? 'private');
  const [selected, setSelected] = useState<string[]>(
    agent?.tools.map((tool) => tool.id) || [],
  );

  const [formState, formAction] = useActionState<
    ActionStateData<ClientAgent>,
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
      onSuccessRef.current(formState.data);
    }
  }, [formState, setOpen, mutate, agent]);

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
          </DialogHeader>
          <Form id={form} action={formAction}>
            <input type="hidden" name="id" value={agent?.id} />
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
                  defaultValue={agent?.name}
                />
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2 items-center">
                  <Label
                    htmlFor={`${formId}-system-prompt`}
                    className="text-zinc-600 font-normal dark:text-zinc-400"
                  >
                    System Prompt
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    className="p-1 size-6"
                    onClick={() => setOpenPromptTemplate(true)}
                  >
                    <Fullscreen />
                  </Button>
                </div>
                <PromptTemplate
                  formId={form}
                  name="systemPrompt"
                  placeholder="You are a useful assistant"
                  agent={agent}
                  openDialog={openPromptTemplate}
                  setOpenDialog={setOpenPromptTemplate}
                />
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
              <SubmitButton isSuccessful={formState.status === 'success'}>
                Save
              </SubmitButton>
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
