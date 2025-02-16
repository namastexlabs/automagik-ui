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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from './ui/dialog';

export function PromptTemplate({
  name,
  placeholder,
  agent,
  formId,
  openDialog,
  setOpenDialog,
  template,
  onChange,
}: {
  template: string;
  onChange: (template: string) => void;
  name: string;
  placeholder: string;
  agent?: ClientAgent | null;
  formId: string;
  openDialog: boolean;
  setOpenDialog: (isOpen: boolean) => void;
}) {
  const [open, setOpen] = useState<number | null>(null);

  const deferredTemplate = useDeferredValue(template);
  const [dynamicBlocks, setDynamicBlocks] = useState<
    { name: string; visibility: 'private' | 'public' }[]
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
                form={formId}
                id={`dynamicBlocks[${index}][visibility]`}
                checked={block.visibility === 'public'}
                onCheckedChange={(value) =>
                  handleBlockVisibilityChange(
                    index,
                    value ? 'public' : 'private',
                  )
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
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="flex flex-col w-[90vw] h-[90vh] max-w-none">
          <DialogTitle className="h-min">System Prompt</DialogTitle>
          <DialogDescription>Update your system prompt.</DialogDescription>
          <Textarea
            name={name}
            className="resize-none bg-muted text-lg flex-1"
            value={template}
            onChange={(e) => onChange(e.target.value)}
          />
          <div className="flex gap-2 items-center overflow-x-auto w-[87vw] py-2">
            {badges}
          </div>
        </DialogContent>
      </Dialog>
      <Textarea
        disabled={openDialog}
        name={name}
        rows={10}
        className="bg-muted text-md md:text-sm resize-none"
        placeholder={placeholder}
        required
        value={template}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="flex gap-2 items-center overflow-x-auto w-[29rem] py-2">
        {badges}
      </div>
    </>
  );
}
