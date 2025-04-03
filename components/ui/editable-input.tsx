'use client';

import { useState, useRef } from 'react';
import { PencilIcon, CheckIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Input } from './input';
import { Button } from './button';

interface EditableInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  isEditable?: boolean;
  defaultValue: string;
  className?: string;
  initialEditing?: boolean;
}

export function EditableInput({
  isEditable = false,
  defaultValue,
  className,
  initialEditing = false,
  placeholder,
  ...props
}: EditableInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(initialEditing);
  const [value, setValue] = useState(defaultValue);

  if (!isEditable) {
    return <div className={cn('py-2 px-3', className)}>{defaultValue}</div>;
  }

  if (!isEditing) {
    return (
      <Button
        type="button"
        variant="ghost"
        className="group relative w-full flex !text-[1em] items-center gap-2 h-auto p-0 hover:bg-transparent"
        onClick={() => setIsEditing(true)}
      >
        <div className={cn('py-2 mr-auto', className)}>
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
    <div className="flex gap-2">
      <Input
        className={cn('!text-[1em]', className)}
        {...props}
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        ref={inputRef}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => {
          if (inputRef.current?.checkValidity()) {
            setIsEditing(false);
          } else {
            inputRef.current?.reportValidity();
          }
        }}
      >
        <CheckIcon className="size-4" />
      </Button>
    </div>
  );
}
