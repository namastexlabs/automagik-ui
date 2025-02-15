'use client';

import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { chatModels, getModelData } from '@/lib/ai/models';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

import { CheckCircleFillIcon, ChevronDownIcon } from './icons';
import { setModelCookie } from '@/lib/ai/cookies';

export function ModelSelector({
  selectedModelId,
  selectedProvider,
  onChangeModelId,
  onChangeProvider,
  className,
}: {
  selectedModelId: string;
  selectedProvider: string;
  onChangeModelId: (modelId: string) => void;
  onChangeProvider: (provider: string) => void;
} & React.ComponentProps<typeof Button>) {
  const [open, setOpen] = useState(false);
  const currentModelRef = useRef<HTMLDivElement>(null);

  const modelData = getModelData(selectedProvider, selectedModelId);

  useEffect(() => {
    if (open) {
      currentModelRef.current?.scrollIntoView({
        block: 'start',
      });
    }
  }, [selectedModelId, selectedProvider, open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        asChild
        className={cn(
          'w-fit data-[state=open]:bg-accent data-[state=open]:text-accent-foreground',
          className,
        )}
      >
        <Button variant="outline" className="md:px-2 md:h-[34px]">
          {modelData?.name}
          <ChevronDownIcon />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className={`p-0 ${open ? '' : 'hidden'}`} forceMount>
        <Command>
          <CommandInput placeholder="Search models..." />
          <CommandEmpty>No models found</CommandEmpty>
          <CommandList>
            {Object.entries(chatModels).map(([provider, models]) => (
              <CommandGroup
                key={provider}
                heading={provider}
                className="capitalize"
              >
                {Object.entries(models).map(([modelId, model]) => (
                  <CommandItem
                    key={modelId}
                    ref={
                      selectedModelId === modelId &&
                      selectedProvider === provider
                        ? currentModelRef
                        : undefined
                    }
                    keywords={[provider, model.name]}
                    className="cursor-pointer"
                    onSelect={() => {
                      onChangeProvider(provider);
                      onChangeModelId(modelId);
                      setModelCookie(provider, modelId);
                      setOpen(false);
                    }}
                  >
                    {model.name}
                    {selectedProvider === provider &&
                    selectedModelId === modelId ? (
                      <CheckCircleFillIcon />
                    ) : null}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
