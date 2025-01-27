import { useDeferredValue, useEffect, useState } from 'react';
import { Ellipsis } from 'lucide-react';

import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { ClientAgent } from '@/lib/data';
import { getDynamicBlocksFromPrompt } from '@/lib/agents/dynamic-blocks';

export function PromptTemplate({
  name,
  placeholder,
  agent,
  formId,
}: {
  name: string;
  placeholder: string;
  agent?: ClientAgent | null;
  formId: string;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const [template, setTemplate] = useState(agent?.systemPrompt || '');

  const deferredTemplate = useDeferredValue(template);
  const [dynamicBlocks, setDynamicBlocks] = useState<
    { name: string; global: boolean }[]
  >([]);

  useEffect(() => {
    setDynamicBlocks((state) =>
      getDynamicBlocksFromPrompt(deferredTemplate).map((block) => {
        const agentBlock = agent?.dynamicBlocks.find(
          ({ name }) => name === block,
        );
        const stateBlock = state.find(({ name }) => name === block);

        return {
          name: block.trim(),
          global: stateBlock?.global || agentBlock?.global || false,
        };
      }),
    );
  }, [deferredTemplate, agent]);

  const handleBlockGlobalChange = (index: number, value: boolean) => {
    setDynamicBlocks((state) =>
      state.map((block, stateIndex) =>
        index === stateIndex ? { ...block, global: value } : block,
      ),
    );
  };

  const badges = dynamicBlocks.map((block, index) => {
    const isOpen = open === index;
    return (
      <Badge
        key={block.name}
        variant="secondary"
        className="flex items-center text-xs pl-2 pr-1"
      >
        <span>{block.name}</span>
        <Popover
          open={isOpen}
          onOpenChange={(value) => setOpen(value ? index : null)}
        >
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className="items-center justify-center size-[1.2em] rounded-full p-0 ml-1 [&_svg]:size-[0.8em]"
              type="button"
            >
              <Ellipsis />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            forceMount
            className={isOpen ? 'size-min' : 'hidden'}
            align="start"
          >
            <div className="flex gap-2 items-center">
              <Label htmlFor={`dynamicBlocks[${index}][global]`}>Global</Label>
              <Switch
                form={formId}
                id={`dynamicBlocks[${index}][global]`}
                checked={block.global}
                onCheckedChange={(value) =>
                  handleBlockGlobalChange(index, value)
                }
              />
              <input
                form={formId}
                type="hidden"
                name="dynamicBlocks"
                value={JSON.stringify(block)}
              />
            </div>
          </PopoverContent>
        </Popover>
      </Badge>
    );
  });

  return (
    <>
      <Textarea
        name={name}
        className="bg-muted text-md md:text-sm md:h-[140px]"
        placeholder={placeholder}
        required
        value={template}
        onChange={(e) => setTemplate(e.target.value)}
      />
      <div className="flex flex-wrap gap-2 items-center">{badges}</div>
    </>
  );
}
