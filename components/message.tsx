'use client';

import type { Message, ToolInvocation as AIToolInvocation } from 'ai';
import cx from 'classnames';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';

import type { InternalToolInvocationPayload } from '@/lib/agents/tool-declarations/client';
import type { Vote } from '@/lib/db/schema';
import { cn } from '@/lib/utils';
import { getToolName, getToolSource } from '@/lib/agents/client';

import { Markdown } from './markdown';
import { PencilEditIcon } from './icons';
import { MessageActions } from './message-actions';
import { PreviewAttachment } from './preview-attachment';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { MessageEditor } from './message-editor';
import { ToolInvocation } from './internal-tool-invocation';
import { Badge } from './ui/badge';
import { MessageReasoning } from './message-reasoning';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

export function PreviewMessage({
  chatId,
  message,
  vote,
  isLoading,
  isReadonly,
  agentName,
  agentAvatarUrl,
}: {
  chatId?: string;
  agentName?: string | null;
  agentAvatarUrl?: string | null;
  message: Message;
  vote: Vote | undefined;
  isLoading: boolean;
  isReadonly: boolean;
}) {
  const [mode, setMode] = useState<'view' | 'edit'>('view');

  const renderToolInvocation = (toolInvocation: AIToolInvocation) => {
    const source = getToolSource(toolInvocation.toolName);

    switch (source) {
      case 'automagik':
        return (
          <div key={`${toolInvocation.toolCallId} ${toolInvocation.state}`}>
            <Badge variant="secondary" className="text-md">
              Running Flow...
            </Badge>
          </div>
        );
      case 'internal':
        return (
          <ToolInvocation
            key={`${toolInvocation.toolCallId} ${toolInvocation.state}`}
            toolInvocation={
              {
                ...toolInvocation,
                toolName: getToolName(toolInvocation.toolName),
              } as InternalToolInvocationPayload
            }
            isReadonly={isReadonly}
          />
        );
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="motion w-full px-4 group/message"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        data-role={message.role}
      >
        <div
          className={cn(
            'flex gap-4 w-full group-data-[role=user]/message:ml-auto',
            {
              'w-full': mode === 'edit',
            },
          )}
        >
          {message.role === 'assistant' && (
            <div className="size-8 flex items-center rounded-full justify-center shrink-0">
              <div className="translate-y-px">
                <Avatar className="size-9 text-md font-bold">
                  <AvatarImage
                    src={agentAvatarUrl || undefined}
                    alt={agentName || ''}
                  />
                  <AvatarFallback className="bg-white text-black">
                    {agentName?.slice(0, 2).toUpperCase() || ''}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4 w-full min-w-0">
            {message.experimental_attachments && (
              <div className="flex flex-row flex-wrap justify-end gap-2">
                {message.experimental_attachments.map((attachment) => (
                  <PreviewAttachment
                    key={attachment.url}
                    attachment={attachment}
                  />
                ))}
              </div>
            )}

            {message.parts?.map((part, index) => {
              switch (part.type) {
                case 'text':
                  return (
                    <div
                      // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                      key={index}
                      className={cn('flex flex-col gap-2 items-start', {
                        'items-end': message.role === 'user',
                        hidden: mode === 'edit',
                      })}
                    >
                      <div
                        className={cn(
                          'flex flex-col max-w-full gap-4 break-words',
                          {
                            'bg-white text-black px-3 py-2 rounded-xl':
                              message.role === 'user',
                          },
                        )}
                      >
                        <Markdown>{part.text}</Markdown>
                      </div>
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
                    </div>
                  );
                case 'reasoning':
                  return (
                    part.reasoning && (
                      <MessageReasoning
                        // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                        key={index}
                        isLoading={isLoading}
                        reasoning={part.reasoning}
                      />
                    )
                  );
                case 'tool-invocation':
                  return renderToolInvocation(part.toolInvocation);
                default:
                  return null;
              }
            })}

            {message.content && mode === 'edit' && (
              <div className="flex flex-row gap-2 items-start">
                <div className="size-8" />
                <MessageEditor
                  key={message.id}
                  message={message}
                  setMode={setMode}
                />
              </div>
            )}

            {!isReadonly && (
              <MessageActions
                key={`action-${message.id}`}
                chatId={chatId}
                message={message}
                vote={vote}
              />
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export const ThinkingMessage = ({
  agentAvatarUrl,
  agentName,
}: {
  agentAvatarUrl?: string | null;
  agentName?: string | null;
}) => {
  const role = 'assistant';

  return (
    <motion.div
      className="motion w-full px-4 group/message "
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
        <div className="size-8 flex items-center rounded-full justify-center shrink-0">
          <Avatar className="size-9 text-md font-bold">
            <AvatarImage
              src={agentAvatarUrl || undefined}
              alt={agentName || ''}
            />
            <AvatarFallback className="bg-white text-black">
              {agentName?.slice(0, 2).toUpperCase() || ''}
            </AvatarFallback>
          </Avatar>
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
