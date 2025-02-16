'use client';

import { useActionState, useEffect, useId, useState } from 'react';
import Form from 'next/form';
import { toast } from 'sonner';
import { PlusIcon } from 'lucide-react';
import { useSWRConfig } from 'swr';

import { saveFlowTool } from '@/app/(chat)/actions';
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
}: {
  tool?: Omit<ClientTool, 'data'> & { data: ToolData<'automagik'> };
  onCreate: (tool: ClientTool) => void;
}) {
  const formId = useId();
  const [open, setOpen] = useState(false);
  const [isCloseAttempt, setCloseAttempt] = useState(false);
  const [visibility, setVisibility] = useState(tool?.visibility ?? 'public');
  const [selectedFlow, setSelectedFlow] = useState(tool?.data.flowId || null);
  const [name, setName] = useState(tool?.name || '');

  const { mutate } = useSWRConfig();

  const [formState, formAction] = useActionState<
    ActionStateData<ClientTool>,
    FormData
  >(saveFlowTool, { status: 'idle', data: null });

  useEffect(() => {
    if (formState.status === 'failed') {
      toast.error('Unexpected error, please try again!');
    } else if (formState.status === 'invalid_data') {
      toast.error('Failed validating your submission!');
    } else if (formState.status === 'success' && formState.data) {
      onCreate(formState.data);
      toast.success('Tool created successfully');

      mutate<ClientTool[], ClientTool>('/api/tools', formState.data, {
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
  }, [formState, setOpen, mutate, tool, onCreate]);

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
              {tool ? 'Edit' : 'Create'} {tool ? `${tool?.verboseName} tool` : 'Tool'}
            </DialogDescription>
          </DialogHeader>
          <Form id={formId} action={formAction}>
            <input type="hidden" name="id" value={tool?.id} />
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
              </div>
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor={`${formId}-description`}
                  className="text-zinc-600 font-normal dark:text-zinc-400"
                >
                  Description
                </Label>
                <Textarea
                  id={`${formId}-description`}
                  name="description"
                  className="bg-muted text-md md:text-sm md:h-[140px]"
                  placeholder="Use this tool when..."
                  required
                  defaultValue={tool?.description}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor={`${formId}-flow-id`}
                  className="text-zinc-600 font-normal dark:text-zinc-400"
                >
                  Flow
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
