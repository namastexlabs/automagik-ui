import type { ChatRequestOptions, Message } from 'ai';
import equal from 'fast-deep-equal';
import { type Dispatch, memo, type SetStateAction } from 'react';
import useSWR from 'swr';

import type { Vote } from '@/lib/db/schema';
import type { ClientTool } from '@/lib/data';
import { fetcher } from '@/lib/utils';

import type { UIBlock } from './block';
import { Overview } from './overview';
import { useScrollToBottom } from './use-scroll-to-bottom';
import { PreviewMessage, ThinkingMessage } from './message';

interface MessagesProps {
  chatId?: string;
  setBlock: Dispatch<SetStateAction<UIBlock>>;
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
}

function PureMessages({
  chatId,
  setBlock,
  isLoading,
  votes,
  messages,
  setMessages,
  reload,
  isReadonly,
}: MessagesProps) {
  const {
    data: tools = [],
    isLoading: isToolsLoading
  } = useSWR<ClientTool[]>(
    '/api/tools',
    fetcher,
  );
  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();

  return (
    <div
      ref={messagesContainerRef}
      className="flex flex-col min-w-0 gap-6 flex-1 overflow-y-scroll pt-4"
    >
      {messages.length === 0 && <Overview />}

      {messages.map((message, index) => (
        <PreviewMessage
          isToolsLoading={isToolsLoading}
          key={message.id}
          tools={tools}
          chatId={chatId}
          message={message}
          setBlock={setBlock}
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

      <div
        ref={messagesEndRef}
        className="shrink-0 min-w-[24px] min-h-[24px]"
      />
    </div>
  );
}

export const Messages = memo(PureMessages, (prevProps, nextProps) => {
  if (prevProps.isLoading !== nextProps.isLoading) return false;
  if (prevProps.isLoading && nextProps.isLoading) return false;
  if (prevProps.messages !== nextProps.messages) return false;
  if (!equal(prevProps.votes, nextProps.votes)) return false;

  return true;
});
