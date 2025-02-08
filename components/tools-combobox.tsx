'use client';

import { useCallback, useState } from 'react';
import { ChevronsUpDown } from 'lucide-react';
import useSWR from 'swr';

import { fetcher } from '@/lib/utils';
import type { ClientTool } from '@/lib/data';

import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Button } from './ui/button';
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from './ui/command';
import { Checkbox } from './ui/checkbox';
import { Skeleton } from './ui/skeleton';
import { FlowFormDialog } from './flow-form-dialog';

export function ToolsCombobox({
  selected,
  onChange,
  formId,
}: {
  formId: string;
  selected: string[];
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const { data: tools = [], isLoading } = useSWR<ClientTool[]>(
    '/api/tools',
    fetcher,
  );

  const availableTools = tools.filter((tool) =>
    tool.source === 'internal' ? tool.visibility === 'public' : true,
  );

  const handleCreate = useCallback(
    (tool: ClientTool) => onChange(tool.id),
    [onChange],
  );
  const selectedTools = availableTools
    .filter((tool) => selected.includes(tool.id))
    .map((tool) => tool.verboseName)
    .join(', ');

  const toolCommands = availableTools.map((tool) => (
    <CommandItem
      key={tool.id}
      className="cursor-pointer py-1 text-[0.85rem]"
      onSelect={() => onChange(tool.id)}
    >
      <Checkbox checked={selected.includes(tool.id)} />
      <span className="w-[350px] truncate cursor-pointer">
        {tool.verboseName}
      </span>
      <input
        key={tool.id}
        readOnly
        form={formId}
        id={tool.id}
        type="checkbox"
        name="tools"
        className="hidden"
        value={tool.id}
        checked={selected.includes(tool.id)}
      />
    </CommandItem>
  ));

  return (
    <Popover modal={open} open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="justify-between bg-muted"
        >
          <div className="w-full text-start">
            <span className="truncate block min-w-[200px] w-[440px]">
              {selected.length > 0 ? selectedTools : 'Select tools...'}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        forceMount
        className={`mt-3 p-0 w-[400px] h-[200px] ${open ? '' : 'hidden'}`}
        align="start"
      >
        {isLoading ? (
          <div className="flex flex-col gap-2 p-2">
            {Array.from({ length: 5 }).map((_, v) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: Array's order don't change
              <Skeleton key={v} className="w-full h-4" />
            ))}
          </div>
        ) : (
          <Command>
            <CommandInput placeholder="Search tools..." />
            <CommandEmpty>No tools found</CommandEmpty>
            <CommandList className="flex-1">{toolCommands}</CommandList>
            <div className="flex bg-background border-t-2 p-1 w-full">
              <FlowFormDialog onCreate={handleCreate} />
            </div>
          </Command>
        )}
      </PopoverContent>
    </Popover>
  );
}
