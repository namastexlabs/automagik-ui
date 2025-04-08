'use client';

import { memo, useEffect, useRef, useState } from 'react';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { chatModels, getModelData, getModelIcon } from '@/lib/ai/models';
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

import { CheckCircleFillIcon } from './icons';
import { setModelCookie } from '@/lib/ai/cookies';
import { ChevronRightIcon } from 'lucide-react';

function PureModelSelector({
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
  const modelIcon = getModelIcon(selectedProvider);

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
        <Button
          variant="ghost"
          className="group/model-selector flex items-center h-full gap-2 bg-dark-gray py-1.5 px-3 rounded-lg text-start"
        >
          {modelIcon && (
            <div className="size-8 shrink-0 rounded-full bg-white flex items-center justify-center">
              <Image
                src={modelIcon}
                alt={selectedProvider}
                width={28}
                height={28}
              />
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-xs capitalize text-muted-foreground">
              {selectedProvider}
            </span>
            <span className="text-sm font-bold text-foreground">{modelData?.name}</span>
          </div>
          <ChevronRightIcon size={24} className="ml-2 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className={`p-0 ${open ? '' : 'hidden'}`}
        forceMount
      >
        <Command>
          <CommandInput placeholder="Search models..." />
          <CommandEmpty>No models found</CommandEmpty>
          <CommandList>
            {Object.entries(chatModels).map(([provider, models]) => (
              <CommandGroup
                key={provider}
                heading={
                  <div className="flex items-center gap-1">
                    {getModelIcon(provider) && (
                      <div className="size-6 shrink-0 rounded-full bg-white flex items-center justify-center">
                        <Image
                          src={getModelIcon(provider) as string}
                          alt={provider}
                          width={20}
                          height={20}
                        />
                      </div>
                    )}
                    <span className="text-sm">{provider}</span>
                  </div>
                }
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

export const ModelSelector = memo(PureModelSelector);
