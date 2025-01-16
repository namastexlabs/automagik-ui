import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { XIcon } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function DynamicBlocks({
  formId,
  onReset,
}: {
  formId: string;
  onReset: (set: (tags: string[]) => void) => void;
}) {
  const [tags, setTags] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    onReset((newTags) => setTags(newTags));
  }, [onReset]);

  const addTag = (tag: string) => {
    if (!tag) {
      return;
    }
    if (tags.includes(tag)) {
      toast.error('Duplicate tag');
    } else {
      setTags((state) => [...state, tag]);
      setInputValue('');
    }
  };

  const removeTag = (tag: string) => {
    setTags((state) => state.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue.trim());
    }
  };

  const handleBlur = () => {
    if (inputValue.trim()) {
      addTag(inputValue.trim());
    }
    setInputValue('');
  };

  const checkboxes = tags.map((tag) => (
    <input
      key={tag}
      readOnly
      id={tag}
      type="checkbox"
      name="dynamicBlocks"
      className="hidden"
      value={tag}
      checked
    />
  ));

  return (
    <div className="flex flex-col gap-2.5">
      {checkboxes}
      <Input
        placeholder="Add a block (press , or Enter)"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
      />
      <div className="flex flex-wrap items-center gap-2">
        {tags.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="flex items-center text-xs pl-1.8 pr-1.1"
          >
            <span>{tag}</span>
            <Button
              variant="ghost"
              className="items-center justify-center size-[1.2em] rounded-full p-0 ml-1 [&_svg]:size-[0.8em] hover:bg-destructive"
              onClick={() => removeTag(tag)}
            >
              <XIcon strokeWidth={3} />
            </Button>
          </Badge>
        ))}
      </div>
    </div>
  );
}
