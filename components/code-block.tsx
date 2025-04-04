'use client';

import { cn } from '@/lib/utils';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { useCopyToClipboard } from 'usehooks-ts';

import { CodeIcon, LoaderIcon, PlayIcon, PythonIcon, CopyIcon } from './icons';
import { Button } from './ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

interface CodeBlockProps {
  node: any;
  inline: boolean;
  className: string;
  children: any;
}

export function CodeBlock({
  node,
  inline,
  className,
  children,
  ...props
}: CodeBlockProps) {
  const [output, setOutput] = useState<string | null>(null);
  const [pyodide, setPyodide] = useState<any>(null);
  const [_, copyToClipboard] = useCopyToClipboard();
  const match = /language-(\w+)/.exec(className || '');
  const isPython = match && match[1] === 'python';
  const codeContent = String(children).replace(/\n$/, '');
  const [tab, setTab] = useState<'code' | 'run'>('code');

  if (!inline) {
    return (
      <div className="group/code-block not-prose flex flex-col relative text-muted-foreground">
        {tab === 'code' && (
          <pre
            {...props}
            className={`text-sm w-full overflow-x-auto bg-dark-background p-4 border border-muted rounded-xl`}
          >
            <code className="whitespace-pre-wrap break-words">{children}</code>
          </pre>
        )}

        {tab === 'run' && output && (
          <div className="text-sm w-full overflow-x-auto rounded-b-xl">
            <code>{output}</code>
          </div>
        )}
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="absolute hidden group-hover/code-block:block py-1 px-2 right-3 top-3 size-fit"
                variant="outline"
                onClick={async () => {
                  await copyToClipboard(codeContent);
                  toast.success('Copied to clipboard!');
                }}
              >
                <CopyIcon />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  } else {
    return (
      <code
        className={`${className} text-sm bg-dark-background border border-muted text-muted-foreground py-0.5 px-1 rounded-md`}
        {...props}
      >
        {children}
      </code>
    );
  }
}
