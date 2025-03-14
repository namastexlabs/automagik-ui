'use client';

import { useState } from 'react';
import { ChevronsUpDown } from 'lucide-react';
import useSWR from 'swr';

import { fetcher } from '@/lib/utils';
import type { FlowData } from '@/lib/services/types';

import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Button } from './ui/button';
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from './ui/command';
import { Skeleton } from './ui/skeleton';

export function FlowsCombobox({
  selected,
  onChange,
  formId,
}: {
  formId: string;
  selected: string | null;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const { data: flows = [], isLoading } = useSWR<FlowData[]>(
    '/api/automagik/flows',
    fetcher,
  );

  const selectedFlow = flows.find((flow) => selected === flow.id);
  const flowCommands = flows.map((flow) => (
    <CommandItem
      key={flow.id}
      onSelect={() => {
        onChange(flow.id);
        setOpen(false);
      }}
    >
      <span className="w-96 truncate cursor-pointer">{flow.name}</span>
      {selected === flow.id && (
        <input
          key={flow.id}
          readOnly
          form={formId}
          id={flow.id}
          type="hidden"
          name="flowId"
          value={flow.id}
        />
      )}
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
            <span className="w-96 truncate block">
              {selectedFlow?.name || 'Select flow...'}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        forceMount
        className={`mt-3 p-0 h-[200px] ${open ? '' : 'hidden'}`}
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
            <CommandInput placeholder="Search flows..." />
            <CommandEmpty>No flows found</CommandEmpty>
            <CommandList className="flex-1">{flowCommands}</CommandList>
          </Command>
        )}
      </PopoverContent>
    </Popover>
  );
}
