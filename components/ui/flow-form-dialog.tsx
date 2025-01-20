'use client';

import { useActionState, useEffect, useId, useState } from 'react';
import { toast } from 'sonner';
import { useSWRConfig } from 'swr';
import { saveFlowTool } from '@/app/(chat)/actions';

import type { ActionStateData } from '@/app/types';
import type { ClientTool } from '@/lib/data';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog';
import { Button } from './button';
import { PlusIcon } from 'lucide-react';
import Form from 'next/form';
import { Label } from './label';
import { Input } from './input';
import { Textarea } from './textarea';
import { SubmitButton } from '../submit-button';

export function FlowFormDialog({
  tool,
  onCreate,
}: {
  tool?: ClientTool;
  onCreate: (tool: ClientTool) => void;
}) {
  const formId = useId();
  const [open, setOpen] = useState(false);
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="py-0.5 px-2 gap-1 ml-auto text-[0.8rem] h-max justify-start"
        >
          <PlusIcon />New Tool
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {tool ? `Update ${tool.verboseName}` : 'New Tool'}
          </DialogTitle>
          <DialogDescription>
            {tool
              ? 'Update an existing tool'
              : 'Create a new tool to be used in your agent'}
          </DialogDescription>
        </DialogHeader>
        <Form action={formAction}>
          <input type="hidden" name="id" value={tool?.id} />
          <input
            type="hidden"
            name="name"
            value={tool && toCamelCase(tool.verboseName)}
          />
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
                defaultValue={tool?.verboseName}
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
                Flow ID
              </Label>
              <Input
                id={`${formId}-flow-id`}
                name="flowId"
                className="bg-muted text-md md:text-sm"
                placeholder="Flow ID to run on tool calling"
                required
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
