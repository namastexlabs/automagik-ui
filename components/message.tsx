'use client';

import type {
  ChatRequestOptions,
  Message,
  ToolInvocation as AIToolInvocation,
} from 'ai';
import cx from 'classnames';
import { motion } from 'framer-motion';
import equal from 'fast-deep-equal';
import { memo, useState, type Dispatch, type SetStateAction } from 'react';

import {
  castToolType,
  type InternalToolInvocationPayload,
} from '@/lib/agents/tool-declarations/client';
import type { Vote } from '@/lib/db/schema';
import { cn } from '@/lib/utils';
import type { ClientTool } from '@/lib/data';

import type { UIBlock } from './block';
import { PencilEditIcon, SparklesIcon } from './icons';
import { Markdown } from './markdown';
import { MessageActions } from './message-actions';
import { PreviewAttachment } from './preview-attachment';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { MessageEditor } from './message-editor';
import { ToolInvocation } from './internal-tool-invocation';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';

function PurePreviewMessage({
  chatId,
  message,
  setBlock,
  vote,
  isLoading,
  setMessages,
  reload,
  isReadonly,
  tools,
  isToolsLoading,
}: {
  chatId?: string;
  message: Message;
  setBlock: Dispatch<SetStateAction<UIBlock>>;
  vote: Vote | undefined;
  isLoading: boolean;
  tools: ClientTool[];
  isToolsLoading: boolean;
  setMessages: (
    messages: Message[] | ((messages: Message[]) => Message[]),
  ) => void;
  reload: (
    chatRequestOptions?: ChatRequestOptions,
  ) => Promise<string | null | undefined>;
  isReadonly: boolean;
}) {
  const [mode, setMode] = useState<'view' | 'edit'>('view');

  const renderToolInvocation = (toolInvocation: AIToolInvocation) => {
    if (isToolsLoading) {
      return <Skeleton key={toolInvocation.toolCallId} className="h-6" />;
    }

    const userTool = tools.find(
      (tool) => tool.name === toolInvocation.toolName,
    );

    if (!userTool) {
      return null;
    }

    switch (true) {
      case castToolType('automagik', userTool):
        return (
          <div key={`${toolInvocation.toolCallId} ${toolInvocation.state}`}>
            <Badge variant="secondary" className="text-md">
              Running Flow #{userTool.data.flowId.slice(0, 8)}...
            </Badge>
          </div>
        );
      case castToolType('internal', userTool):
        return (
          <ToolInvocation
            key={`${toolInvocation.toolCallId} ${toolInvocation.state}`}
            toolInvocation={toolInvocation as InternalToolInvocationPayload}
            setBlock={setBlock}
            isReadonly={isReadonly}
          />
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      className="w-full mx-auto max-w-3xl px-4 group/message"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      data-role={message.role}
    >
      <div
        className={cn(
          'flex gap-4 w-full group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl',
          {
            'w-full': mode === 'edit',
            'group-data-[role=user]/message:w-fit': mode !== 'edit',
          },
        )}
      >
        {message.role === 'assistant' && (
          <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background">
            <SparklesIcon size={14} />
          </div>
        )}

        <div className="flex flex-col gap-2 w-full">
          {message.experimental_attachments && (
            <div className="flex flex-row justify-end gap-2">
              {message.experimental_attachments.map((attachment) => (
                <PreviewAttachment
                  key={attachment.url}
                  attachment={attachment}
                />
              ))}
            </div>
          )}

          {message.content && mode === 'view' && (
            <div className="flex flex-row gap-2 items-start">
              {message.role === 'user' && !isReadonly && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      className="px-2 h-fit rounded-full text-muted-foreground opacity-0 group-hover/message:opacity-100"
                      onClick={() => {
                        setMode('edit');
                      }}
                    >
                      <PencilEditIcon />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Edit message</TooltipContent>
                </Tooltip>
              )}

              <div
                className={cn('flex flex-col gap-4', {
                  'bg-primary text-primary-foreground px-3 py-2 rounded-xl':
                    message.role === 'user',
                })}
              >
                <Markdown>{message.content as string}</Markdown>
              </div>
            </div>
          )}

          {message.content && mode === 'edit' && (
            <div className="flex flex-row gap-2 items-start">
              <div className="size-8" />

              <MessageEditor
                key={message.id}
                message={message}
                setMode={setMode}
                setMessages={setMessages}
                reload={reload}
              />
            </div>
          )}

          {message.toolInvocations && message.toolInvocations.length > 0 && (
            <div className="flex flex-col gap-4">
              {message.toolInvocations.map(renderToolInvocation)}
            </div>
          )}

          {!isReadonly && (
            <MessageActions
              key={`action-${message.id}`}
              chatId={chatId}
              message={message}
              vote={vote}
              isLoading={isLoading}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
}

export const PreviewMessage = memo(
  PurePreviewMessage,
  (prevProps, nextProps) => {
    if (prevProps.isLoading !== nextProps.isLoading) return false;
    if (prevProps.message.content !== nextProps.message.content) return false;
    if (prevProps.tools !== nextProps.tools) return false;
    if (
      !equal(
        prevProps.message.toolInvocations,
        nextProps.message.toolInvocations,
      )
    )
      return false;
    if (!equal(prevProps.vote, nextProps.vote)) return false;

    return true;
  },
);

export const ThinkingMessage = () => {
  const role = 'assistant';

  return (
    <motion.div
      className="w-full mx-auto max-w-3xl px-4 group/message "
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { delay: 1 } }}
      data-role={role}
    >
      <div
        className={cx(
          'flex gap-4 group-data-[role=user]/message:px-3 w-full group-data-[role=user]/message:w-fit group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:py-2 rounded-xl',
          {
            'group-data-[role=user]/message:bg-muted': true,
          },
        )}
      >
        <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border">
          <SparklesIcon size={14} />
        </div>

        <div className="flex flex-col gap-2 w-full">
          <div className="flex flex-col gap-4 text-muted-foreground">
            Thinking...
          </div>
        </div>
      </div>
    </motion.div>
  );
};
