'use client';

import { type ReactNode, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

import {
  CheckCircleFillIcon,
  GlobeIcon,
  LockIcon,
} from './icons';

export type VisibilityType = 'private' | 'public';

const visibilities: Array<{
  id: VisibilityType;
  label: string;
  description: string;
  icon: ReactNode;
}> = [
  {
    id: 'private',
    label: 'Private',
    description: 'Only you can access',
    icon: <LockIcon size={20} />,
  },
  {
    id: 'public',
    label: 'Public',
    description: 'Anyone signed up can access',
    icon: <GlobeIcon size={20} />,
  },
];

export function VisibilitySelector({
  className,
  selectedVisibilityType,
  onChange,
}: {
  className?: string;
  selectedVisibilityType: VisibilityType;
  onChange: (visibilityType: VisibilityType) => void;
}) {
  const [open, setOpen] = useState(false);

  const selectedVisibility = useMemo(() => {
    return visibilities.find((v) => v.id === selectedVisibilityType);
  }, [selectedVisibilityType]);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        asChild
        className={cn(
          'w-fit data-[state=open]:bg-accent data-[state=open]:text-foreground',
          className,
        )}
      >
        <Button variant="secondary" className="rounded-full h-auto p-3">
          {selectedVisibility?.icon}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="min-w-[300px]">
        {visibilities.map((visibility) => (
          <DropdownMenuItem
            key={visibility.id}
            onSelect={() => {
              onChange(visibility.id);
              setOpen(false);
            }}
            className="gap-4 group/item flex flex-row justify-between items-center"
            data-active={visibility.id === selectedVisibilityType}
          >
            <div className="flex flex-col gap-1 items-start">
              {visibility.label}
              {visibility.description && (
                <div className="text-xs text-muted-foreground">
                  {visibility.description}
                </div>
              )}
            </div>
            <div className="text-foreground dark:text-foreground opacity-0 group-data-[active=true]/item:opacity-100">
              <CheckCircleFillIcon />
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
