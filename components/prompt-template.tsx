import { useDeferredValue, useEffect, useState } from 'react';
import { Ellipsis, PencilIcon } from 'lucide-react';

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
import { getDynamicBlocksFromPrompt } from '@/lib/agents/dynamic-blocks';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from './ui/dialog';
import type { AgentDTO } from '@/lib/data/agent';

export function PromptTemplate({
  name,
  placeholder,
  agent,
  template,
  onChange,
  dynamicBlocksName,
  initialDynamicBlocks,
  isDisabled = false,
}: {
  template: string;
  onChange: (template: string) => void;
  name: string;
  dynamicBlocksName: string;
  placeholder: string;
  agent?: AgentDTO | null;
  initialDynamicBlocks?: { name: string; visibility: 'private' | 'public' }[];
  isDisabled?: boolean;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const deferredTemplate = useDeferredValue(template);
  const [dynamicBlocks, setDynamicBlocks] = useState<
    { name: string; visibility: 'private' | 'public' }[]
  >(initialDynamicBlocks || []);

  useEffect(() => {
    setDynamicBlocks((state) =>
      getDynamicBlocksFromPrompt(deferredTemplate).map((block) => {
        const agentBlock = agent?.dynamicBlocks.find(
          ({ name }) => name === block,
        );
        const stateBlock = state.find(({ name }) => name === block);

        return {
          name: block.trim(),
          visibility:
            stateBlock?.visibility || agentBlock?.visibility || 'private',
        };
      }),
    );
  }, [deferredTemplate, agent]);

  const handleBlockVisibilityChange = (
    index: number,
    visibility: 'private' | 'public',
  ) => {
    setDynamicBlocks((state) =>
      state.map((block, stateIndex) =>
        index === stateIndex ? { ...block, visibility } : block,
      ),
    );
  };

  const badgeInputs = dynamicBlocks.map((block) => {
    return (
      <input
        key={block.name}
        type="hidden"
        name={dynamicBlocksName}
        value={JSON.stringify(block)}
      />
    );
  });

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
              <Label htmlFor={`dynamicBlocks[${index}][visibility]`}>
                Public
              </Label>
              <Switch
                id={`dynamicBlocks[${index}][visibility]`}
                checked={block.visibility === 'public'}
                onCheckedChange={(value) =>
                  handleBlockVisibilityChange(
                    index,
                    value ? 'public' : 'private',
                  )
                }
              />
            </div>
          </PopoverContent>
        </Popover>
      </Badge>
    );
  });

  return (
    <>
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="flex flex-col w-[90vw] h-[90vh] max-w-none">
          <DialogTitle className="h-min">System Prompt</DialogTitle>
          <DialogDescription>Update your system prompt.</DialogDescription>
          <Textarea
            name={name}
            disabled={isDisabled}
            className="resize-none bg-muted text-lg flex-1 disabled:opacity-100 disabled:cursor-text"
            value={template}
            onChange={(e) => onChange(e.target.value)}
          />
          <div className="flex gap-2 items-center overflow-x-auto w-[87vw] py-2">
            {badges}
          </div>
        </DialogContent>
      </Dialog>
      <Button
        type="button"
        variant="ghost"
        className="group flex h-auto p-0 hover:bg-transparent gap-3 items-start justify-between"
        onClick={() => setOpenDialog(true)}
      >
        <Textarea
          required
          name={name}
          value={template}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          rows={5}
          className="min-h-[80px] resize-none cursor-pointer flex-1 bg-dark-background border border-muted p-3 pb-0 rounded-lg text-left"
        />
        <div>
          <PencilIcon className="size-4" />
        </div>
      </Button>
      {badgeInputs}
    </>
  );
}
