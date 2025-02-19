'use client';

import type { ChatRequestOptions, Message } from 'ai';
import { AlertCircle } from 'lucide-react';
import { memo } from 'react';
import equal from 'fast-deep-equal';

import type { Vote } from '@/lib/db/schema';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import { PreviewMessage } from './message';
import { useScrollToBottom } from './use-scroll-to-bottom';
import type { UIBlock } from './block';

interface BlockMessagesProps {
  chatId?: string;
  isLoading: boolean;
  votes: Array<Vote> | undefined;
  messages: Array<Message>;
  setMessages: (
    messages: Message[] | ((messages: Message[]) => Message[]),
  ) => void;
  reload: (
    chatRequestOptions?: ChatRequestOptions,
  ) => Promise<string | null | undefined>;
  isReadonly: boolean;
  blockStatus: UIBlock['status'];
  hasError: boolean;
}

function PureBlockMessages({
  chatId,
  isLoading,
  votes,
  messages,
  setMessages,
  reload,
  isReadonly,
  hasError,
}: BlockMessagesProps) {
  const messagesEndRef = useScrollToBottom<HTMLDivElement>(messages);

  return (
    <div className="flex flex-col max-w-full gap-4 h-full items-center overflow-y-scroll px-4 pt-20">
      {messages.map((message, index) => (
        <PreviewMessage
          chatId={chatId}
          key={message.id}
          message={message}
          isLoading={isLoading && index === messages.length - 1}
          vote={
            votes
              ? votes.find((vote) => vote.messageId === message.id)
              : undefined
          }
          setMessages={setMessages}
          reload={reload}
          isReadonly={isReadonly}
        />
      ))}

      {hasError && (
        <div className="mx-auto px-4 max-w-sm w-full">
          <Alert variant="destructive">
            <AlertCircle className="size-5" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Something went wrong, edit the last message or send a new one
            </AlertDescription>
          </Alert>
        </div>
      )}
      <div
        ref={messagesEndRef}
        className="shrink-0 min-w-[24px] min-h-[24px]"
      />
    </div>
  );
}

function areEqual(
  prevProps: BlockMessagesProps,
  nextProps: BlockMessagesProps,
) {
  if (
    prevProps.blockStatus === 'streaming' &&
    nextProps.blockStatus === 'streaming'
  )
    return true;

  if (prevProps.isLoading !== nextProps.isLoading) return false;
  if (prevProps.isLoading && nextProps.isLoading) return false;
  if (prevProps.messages.length !== nextProps.messages.length) return false;
  if (!equal(prevProps.votes, nextProps.votes)) return false;
  if (prevProps.hasError !== nextProps.hasError) return false;

  return true;
}

export const BlockMessages = memo(PureBlockMessages, areEqual);
