'use client';

import { useState } from 'react';
import { ChevronsUpDown } from 'lucide-react';
import useSWR from 'swr';

import { fetcher } from '@/lib/utils';
import type { Tool } from '@/lib/db/schema';

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
  const { data: tools = [], isLoading } = useSWR<Tool[]>('/api/tools', fetcher);

  const selectedTools = tools
    .filter((tool) => selected.includes(tool.id))
    .map((tool) => tool.verboseName)
    .join(', ');

  const toolCheckboxes = tools.map((tool) => (
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
  ));

  const toolCommands = tools.map((tool) => (
    <CommandItem
      key={tool.id}
      className="cursor-pointer"
      onSelect={() => onChange(tool.id)}
    >
      <Checkbox checked={selected.includes(tool.id)} />
      <span className="w-[350px] truncate cursor-pointer">
        {tool.verboseName}
      </span>
    </CommandItem>
  ));

  return (
    <>
      {toolCheckboxes}
      <Popover modal open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="justify-between"
          >
            <div className="w-full text-start">
              <span className="truncate block min-w-[200px] w-[440px]">
                {selected.length > 0 ? selectedTools : 'Select tools...'}
              </span>
            </div>
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="mt-3 p-0 w-[400px]" align="start">
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
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandList>{toolCommands}</CommandList>
            </Command>
          )}
        </PopoverContent>
      </Popover>
    </>
  );
}
