'use client';

import { cn } from '@/lib/utils';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { useCopyToClipboard } from 'usehooks-ts';

import { CodeIcon, LoaderIcon, PlayIcon, PythonIcon, CopyIcon } from './icons';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

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
      <div className="not-prose flex flex-col relative">
        {tab === 'code' && (
          <pre
            {...props}
            className={`text-sm w-full overflow-x-auto dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-700 rounded-xl dark:text-zinc-50 text-zinc-900`}
          >
            <code className="whitespace-pre-wrap break-words">{children}</code>
          </pre>
        )}

        {tab === 'run' && output && (
          <div className="text-sm w-full overflow-x-auto bg-zinc-800 dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-700 border-t-0 rounded-b-xl text-zinc-50">
            <code>{output}</code>
          </div>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="absolute py-1 px-2 right-3 top-3 size-fit text-muted-foreground"
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
      </div>
    );
  } else {
    return (
      <code
        className={`${className} text-sm bg-zinc-100 dark:bg-zinc-800 py-0.5 px-1 rounded-md`}
        {...props}
      >
        {children}
      </code>
    );
  }
}
