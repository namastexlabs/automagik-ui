import { type Dispatch, memo, type SetStateAction } from 'react';
import type { ChatRequestOptions, Message } from 'ai';
import useSWR from 'swr';

import { fetcher } from '@/lib/utils';
import type { Vote } from '@/lib/db/schema';
import type{ ClientTool } from '@/lib/data';

import type { UIBlock } from './block';
import { PreviewMessage } from './message';
import { useScrollToBottom } from './use-scroll-to-bottom';

interface BlockMessagesProps {
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

function PureBlockMessages({
  chatId,
  setBlock,
  isLoading,
  votes,
  messages,
  setMessages,
  reload,
  isReadonly,
}: BlockMessagesProps) {
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
      className="flex flex-col gap-4 h-full items-center overflow-y-scroll px-4 pt-20"
    >
      {messages.map((message, index) => (
        <PreviewMessage
          chatId={chatId}
          key={message.id}
          message={message}
          setBlock={setBlock}
          tools={tools}
          isToolsLoading={isToolsLoading}
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
  return true;
}

export const BlockMessages = memo(PureBlockMessages, areEqual);
