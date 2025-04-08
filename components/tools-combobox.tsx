'use client';

import { useCallback, useState } from 'react';
import { ChevronsUpDown } from 'lucide-react';
import useSWR from 'swr';

import { fetcher } from '@/lib/utils';
import type { ToolDTO } from '@/lib/data/tool';

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
  initialSelected,
  formId,
  isDisabled = false,
}: {
  initialSelected: string[];
  formId: string;
  isDisabled?: boolean;
}) {
  const [selected, setSelected] = useState<string[]>(initialSelected);
  const [openToolForm, setOpenToolForm] = useState(false);
  const [open, setOpen] = useState(false);
  const { data: tools = [], isLoading } = useSWR<ToolDTO[]>(
    '/api/tools',
    fetcher,
  );

  const toggleTool = useCallback((toolId: string) => {
    setSelected((selected) => {
      if (selected.includes(toolId)) {
        return selected.filter((id) => id !== toolId);
      } else {
        return [...selected, toolId];
      }
    });
  }, []);

  const selectedTools = tools
    .filter((tool) => selected.includes(tool.id))
    .map((tool) => tool.verboseName)
    .join(', ');

  const toolCommands = tools.map((tool) => (
    <CommandItem
      key={tool.id}
      className="cursor-pointer py-1 text-[0.85rem] text-foreground"
      onSelect={() => toggleTool(tool.id)}
    >
      <Checkbox checked={selected.includes(tool.id)} />
      <span className="w-96 truncate cursor-pointer">{tool.verboseName}</span>
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
    <Popover modal={open} open={open && !openToolForm} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={isLoading || isDisabled}
          className="group/tools-combobox justify-between bg-transparent hover:bg-transparent p-0 border-none"
        >
          <div className="min-w-0 flex-1 text-start px-3 py-2 rounded-lg bg-dark-background border border-muted hover:bg-dark-background">
            {isLoading ? (
              <Skeleton className="h-4" />
            ) : (
              <span className="truncate block">
                {selected.length > 0 ? selectedTools : 'Select tools...'}
              </span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 size-4 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        forceMount
        className={`mt-3 p-0 w-[260px] h-[400px] ${open ? '' : 'hidden'}`}
        align="end"
      >
        {isLoading ? (
          <div className="flex flex-col gap-2 p-2">
            {Array.from({ length: 5 }).map((_, v) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: Array's order don't change
              <Skeleton key={v} className="w-full h-4" />
            ))}
          </div>
        ) : (
          <Command className="flex flex-col bg-dark-background">
            <CommandInput placeholder="Search tools..." />
            <CommandEmpty>No tools found</CommandEmpty>
            <CommandList className="flex-1 max-h-none">
              {toolCommands}
            </CommandList>
            <div className="flex bg-dark-background border-t-2 h-min w-full">
              <FlowFormDialog
                onCreate={(tool) => toggleTool(tool.id)}
                open={openToolForm}
                setOpen={setOpenToolForm}
              />
            </div>
          </Command>
        )}
      </PopoverContent>
    </Popover>
  );
}
