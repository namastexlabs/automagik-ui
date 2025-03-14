'use client';

import { AlertCircle } from 'lucide-react';

import type { Vote } from '@/lib/db/schema';
import { useChat, useChatMessages } from '@/contexts/chat';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useScrollToBottom } from '@/hooks/use-scroll-to-bottom';

import { PreviewMessage } from './message';
interface BlockMessagesProps {
  votes: Array<Vote> | undefined;
}

export function BlockMessages({ votes }: BlockMessagesProps) {
  const { messages } = useChatMessages();
  const { chat, isLoading, isReadOnly, error } = useChat();
  const containerRef = useScrollToBottom<HTMLDivElement>(messages, isLoading);

  return (
    <div
      className="flex flex-col max-w-full gap-4 h-full items-center overflow-y-auto px-4 pt-20 pb-4"
      ref={containerRef}
    >
      {messages.map((message, index) => (
        <PreviewMessage
          chatId={chat?.id}
          key={message.id}
          message={message}
          isLoading={isLoading && index === messages.length - 1}
          vote={
            votes
              ? votes.find((vote) => vote.messageId === message.id)
              : undefined
          }
          isReadonly={isReadOnly}
        />
      ))}

      {error && (
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
    </div>
  );
}
