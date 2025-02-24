'use client';

import { useActionState, useId, useState } from 'react';
import Form from 'next/form';
import { toast } from 'sonner';
import { PlusIcon } from 'lucide-react';
import { useSWRConfig } from 'swr';

import { type FlowToolSchema, saveFlowTool } from '@/app/(chat)/actions';
import type { ActionStateData } from '@/app/types';
import type { ClientTool } from '@/lib/data';
import type { ToolData } from '@/lib/agents/types';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { SubmitButton } from './submit-button';
import { FlowsCombobox } from './flows-combobox';
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

export function FlowFormDialog({
  tool,
  onCreate,
  open,
  setOpen,
}: {
  tool?: Omit<ClientTool, 'data'> & { data: ToolData<'automagik'> };
  onCreate: (tool: ClientTool) => void;
  open: boolean;
  setOpen: (isOpen: boolean) => void;
}) {
  const formId = useId();
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isCloseAttempt, setCloseAttempt] = useState(false);
  const [visibility, setVisibility] = useState(tool?.visibility ?? 'public');
  const [selectedFlow, setSelectedFlow] = useState(tool?.data.flowId || null);
  const [name, setName] = useState(tool?.name || '');

  const { mutate } = useSWRConfig();

  const [, formAction] = useActionState<
    ActionStateData<ClientTool, FlowToolSchema>,
    FormData
  >(
    async (state, formData) => {
      const newState = await saveFlowTool(state, formData);

      if (newState.status === 'failed') {
        toast.error('Unexpected error, please try again!');
      } else if (newState.status === 'invalid_data') {
        toast.error('Invalid data, please try again!');
        setErrors(
          Object.entries(newState.errors || {}).reduce(
            (acc, [key, value]) => {
              if (Object.hasOwn(value, '_errors')) {
                acc[key] = (value as { _errors: string[] })._errors[0];
              } else {
                acc[key] = (value as string[])[0];
              }
              return acc;
            },
            {} as { [key: string]: string },
          ),
        );
      } else if (newState.status === 'success' && newState.data) {
        onCreate(newState.data);
        toast.success('Tool created successfully');

        mutate<ClientTool[], ClientTool>('/api/tools', newState.data, {
          populateCache: (data, tools = []) => {
            const hasTool = tools.some((tool) => tool.id === data.id);
            if (hasTool) {
              return tools.map((tool) => {
                if (tool.id === data.id) {
                  return data;
                }
                return tool;
              });
            }

            return [...tools, data];
          },
          revalidate: false,
        });
        setOpen(false);
      }

      return newState;
    },
    { status: 'idle', data: null },
  );

  const toCamelCase = (str: string) => {
    return str.replace(/\s([a-z])/g, (_, char) => char.toUpperCase());
  };

  const onChange = (id: string) => {
    setSelectedFlow(id);
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(open) => {
          if (!open) {
            setCloseAttempt(true);
          } else {
            setOpen(open);
          }
        }}
      >
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            className="py-0.5 px-2 gap-1 ml-auto text-[0.8rem] h-max justify-start"
          >
            <PlusIcon />
            New Tool
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between pr-6">
              {tool ? `${tool.verboseName}` : 'New Tool'}
              <VisibilitySelector
                selectedVisibilityType={visibility}
                onChange={setVisibility}
              />
            </DialogTitle>
            <DialogDescription>
              {tool ? 'Edit' : 'Create'}{' '}
              {tool ? `${tool?.verboseName} tool` : 'Tool'}
            </DialogDescription>
          </DialogHeader>
          <Form id={formId} action={formAction}>
            {tool ? <input type="hidden" name="id" value={tool.id} /> : null}
            <input type="hidden" name="name" value={toCamelCase(name)} />
            <input type="hidden" name="visibility" value={visibility} />
            <div className="flex flex-col gap-5 py-3">
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor={`${formId}-verboseName`}
                  className="text-zinc-600 font-normal dark:text-zinc-400"
                >
                  Name
                </Label>
                <Input
                  id={`${formId}-verboseName`}
                  name="verboseName"
                  className="bg-muted text-md md:text-sm"
                  placeholder="Save data"
                  required
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                {!!errors.verboseName && (
                  <span className="text-sm text-destructive">
                    {errors.verboseName}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor={`${formId}-description`}
                  className="text-zinc-600 font-normal dark:text-zinc-400"
                >
                  Description
                </Label>
                <Textarea
                  name="description"
                  rows={10}
                  className="bg-muted text-md md:text-sm resize-none"
                  placeholder="Use this tool when..."
                  required
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.stopPropagation();
                    }
                  }}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor={`${formId}-flow-id`}
                  className="text-zinc-600 font-normal dark:text-zinc-400"
                >
                  Workflow
                </Label>
                <FlowsCombobox
                  formId={formId}
                  selected={selectedFlow}
                  onChange={onChange}
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
