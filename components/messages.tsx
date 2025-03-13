'use client';

import { AlertCircle } from 'lucide-react';

import type { Vote } from '@/lib/db/schema';
import { useScrollToBottom } from '@/hooks/use-scroll-to-bottom';
import { useChat, useChatMessages } from '@/contexts/chat';

import { PreviewMessage, ThinkingMessage } from './message';

import { Overview } from './overview';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

interface MessagesProps {
  votes: Array<Vote> | undefined;
  isBlockVisible: boolean;
}

export function Messages({ votes }: MessagesProps) {
  const { chat, error, isReadOnly, isLoading } = useChat();
  const { messages } = useChatMessages();
  const containerRef = useScrollToBottom<HTMLDivElement>(messages, isLoading);

  return (
    <div
      className="flex flex-col min-w-0 flex-1 overflow-y-auto py-4"
      ref={containerRef}
    >
      {messages.length === 0 && <Overview />}

      <div className="flex flex-col mx-auto w-full max-w-3xl gap-6">
        {messages.map((message, index) => (
          <PreviewMessage
            key={message.id}
            chatId={chat?.id}
            message={message}
            isLoading={isLoading && messages.length - 1 === index}
            vote={
              votes
                ? votes.find((vote) => vote.messageId === message.id)
                : undefined
            }
            isReadonly={isReadOnly}
          />
        ))}

        {isLoading &&
          messages.length > 0 &&
          messages[messages.length - 1].role === 'user' && <ThinkingMessage />}

        {error && (
          <div className="mx-auto max-w-3xl w-full">
            <Alert variant="destructive" className="ml-4 w-max">
              <AlertCircle className="size-5" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Something went wrong, edit the last message or send a new one
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>
    </div>
  );
}
