import type { ChatRequestOptions, Message } from 'ai';
import { memo } from 'react';
import equal from 'fast-deep-equal';

import type { Vote } from '@/lib/db/schema';

import { PreviewMessage, ThinkingMessage } from './message';
import { useScrollToBottom } from './use-scroll-to-bottom';
import { Overview } from './overview';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertCircle } from 'lucide-react';

interface MessagesProps {
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
  isBlockVisible: boolean;
  hasError: boolean;
}

function PureMessages({
  chatId,
  isLoading,
  votes,
  messages,
  setMessages,
  reload,
  isReadonly,
  hasError,
}: MessagesProps) {
  const messagesEndRef = useScrollToBottom<HTMLDivElement>(messages);

  return (
    <div className="flex flex-col min-w-0 flex-1 overflow-y-scroll pt-4">
      {messages.length === 0 && <Overview />}

      <div className="flex flex-col mx-auto w-full max-w-3xl gap-6">
        {messages.map((message, index) => (
          <PreviewMessage
            key={message.id}
            chatId={chatId}
            message={message}
            isLoading={isLoading && messages.length - 1 === index}
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

        {isLoading &&
          messages.length > 0 &&
          messages[messages.length - 1].role === 'user' && <ThinkingMessage />}

        {hasError && (
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
      <div
        ref={messagesEndRef}
        className="shrink-0 min-w-[24px] min-h-[24px]"
      />
    </div>
  );
}

export const Messages = memo(PureMessages, (prevProps, nextProps) => {
  if (prevProps.isBlockVisible && nextProps.isBlockVisible) return true;

  if (prevProps.isLoading !== nextProps.isLoading) return false;
  if (prevProps.isLoading && nextProps.isLoading) return false;
  if (prevProps.reload !== nextProps.reload) return false;
  if (prevProps.messages.length !== nextProps.messages.length) return false;
  if (!equal(prevProps.messages, nextProps.messages)) return false;
  if (!equal(prevProps.votes, nextProps.votes)) return false;
  if (prevProps.isReadonly !== nextProps.isReadonly) return false;
  if (prevProps.hasError !== nextProps.hasError) return false;

  return true;
});
