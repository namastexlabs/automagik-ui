'use client';

import { useState } from 'react';
import { PencilIcon, CheckIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Textarea } from './textarea';
import { Button } from './button';

interface EditableTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  isEditable?: boolean;
  defaultValue: string;
  className?: string;
  initialEditing?: boolean;
}

export function EditableTextarea({
  isEditable = true,
  defaultValue,
  className,
  rows = 4,
  placeholder,
  initialEditing = false,
  ...props
}: EditableTextareaProps) {
  const [isEditing, setIsEditing] = useState(initialEditing);
  const [value, setValue] = useState(defaultValue);

  if (!isEditable) {
    return (
      <div className={cn('min-h-[80px] whitespace-pre-wrap py-2', className)}>
        {defaultValue}
      </div>
    );
  }

  if (!isEditing && props.value) {
    return (
      <Button
        type="button"
        variant="ghost"
        className="group flex h-auto p-0 hover:bg-transparent items-start justify-between !text-[1em]"
        onClick={() => setIsEditing(true)}
      >
        <div
          className={cn(
            `min-h-[80px] line-clamp-6 overflow-clip whitespace-pre-wrap break-words min-w-0 text-left`,
            className,
          )}
          style={{ WebkitLineClamp: rows }}
        >
          {value || placeholder}
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <PencilIcon className="size-4" />
        </div>
        <input type="hidden" name={props.name} value={value} />
      </Button>
    );
  }

  return (
    <div className="group flex gap-2">
      <Textarea
        {...props}
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => setValue(e.target.value)}
        className={cn('!text-[1em] resize-none', className)}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setIsEditing(false)}
      >
        <CheckIcon className="size-4" />
      </Button>
    </div>
  );
}
