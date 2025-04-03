'use client';

import useSWR from 'swr';
import { isYesterday, isToday, subWeeks, subMonths, format } from 'date-fns';
import { Bot } from 'lucide-react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useMemo } from 'react';

import type { Message } from '@/lib/db/schema';
import type { AgentWithMessagesDTO } from '@/lib/data/agent';
import type { ChatWithLatestMessage } from '@/lib/repositories/chat';
import { cn, fetcher } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useSidebar } from '@/components/ui/sidebar';

type GroupedChats = {
  today: ChatWithLatestMessage[];
  yesterday: ChatWithLatestMessage[];
  lastWeek: ChatWithLatestMessage[];
  lastMonth: ChatWithLatestMessage[];
  older: ChatWithLatestMessage[];
};

type AgentItemProps = {
  agent: AgentWithMessagesDTO;
  isOpen: boolean;
  onDelete: (chatId: string) => void;
};

enum GroupLabel {
  Today = 'Today',
  Yesterday = 'Yesterday',
  LastWeek = 'Last week',
  LastMonth = 'Last month',
  Older = 'Older',
}

const getMessageDateLabel = (message: Message) => {
  const now = new Date();
  const messageDate = new Date(message.createdAt);
  const oneWeekAgo = subWeeks(now, 1);
  const oneMonthAgo = subMonths(now, 1);

  if (isToday(messageDate)) {
    return GroupLabel.Today;
  } else if (isYesterday(messageDate)) {
    return GroupLabel.Yesterday;
  } else if (messageDate > oneWeekAgo) {
    return GroupLabel.LastWeek;
  } else if (messageDate > oneMonthAgo) {
    return GroupLabel.LastMonth;
  } else {
    return GroupLabel.Older;
  }
};

export function SidebarAgentItem({ agent, isOpen }: AgentItemProps) {
  const { setOpenMobile, state } = useSidebar();
  const { id } = useParams<{ id?: string }>();

  const {
    data: history,
    isLoading,
    mutate,
  } = useSWR<Array<ChatWithLatestMessage>>(
    `/api/history?agentId=${agent.id}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      revalidateOnMount: false,
    },
  );

  useEffect(() => {
    if (history === undefined && isOpen) {
      mutate();
    }
  }, [isOpen, mutate, history]);

  const currentChat = history ? history[0] : agent.chat;
  const recentMessage = history ? history[0]?.latestMessage : agent.recentMessage;
  const groupedChats = useMemo(() => {
    if (!history) {
      return null;
    }
    const groupChatsByDate = (chats: ChatWithLatestMessage[]): GroupedChats => {
      const now = new Date();
      const oneWeekAgo = subWeeks(now, 1);
      const oneMonthAgo = subMonths(now, 1);

      return chats.reduce(
        (groups, chat) => {
          const chatDate = new Date(chat.latestMessage.createdAt);

          if (isToday(chatDate)) {
            groups.today.push(chat);
          } else if (isYesterday(chatDate)) {
            groups.yesterday.push(chat);
          } else if (chatDate > oneWeekAgo) {
            groups.lastWeek.push(chat);
          } else if (chatDate > oneMonthAgo) {
            groups.lastMonth.push(chat);
          } else {
            groups.older.push(chat);
          }

          return groups;
        },
        {
          today: [],
          yesterday: [],
          lastWeek: [],
          lastMonth: [],
          older: [],
        } as GroupedChats,
      );
    };
    return groupChatsByDate(history.slice(1));
  }, [history]);

  if (!currentChat) {
    return null;
  }

  return (
    <AccordionItem
      value={agent.id}
      className={cn('w-full border-none', {
        'mb-3': isOpen,
        'flex flex-col items-center': state === 'collapsed',
      })}
    >
      <div
        className={cn(
          `group/agent-card flex items-center rounded-md hover:bg-dark-gray transition-colors w-full`,
          {
            'bg-dark-gray': id === currentChat.id,
            '!bg-transparent p-0 justify-center': state === 'collapsed',
          },
        )}
      >
        <Link href={`/chat/${currentChat.id}`}>
          <div className="rounded-full shrink-0 px-2">
            <Avatar className="size-9 text-md font-bold">
              <AvatarImage
                src={agent.avatarUrl || undefined}
                alt={agent.name}
                className="object-cover"
              />
              <AvatarFallback className="bg-transparent">
                <Bot className="size-7" />
              </AvatarFallback>
            </Avatar>
          </div>
        </Link>
        {state === 'expanded' && (
          <div className="flex flex-col flex-1 min-w-0">
            <Link href={`/chat/${currentChat.id}`}>
              <div className="flex justify-between items-center pb-1 pr-2 pt-2">
                <p className="text-foreground font-bold text-sm max-w-40 truncate">
                  {agent.name}
                </p>
                <span className="text-[0.7rem] text-muted-foreground">
                  {getMessageDateLabel(recentMessage)}
                </span>
              </div>
            </Link>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground group-hover/agent-card:text-white truncate w-4/5">
                <Link href={`/chat/${currentChat.id}`}>
                  {recentMessage.content.content}
                </Link>
              </p>
              <AccordionTrigger className="p-0 pr-2 pb-2" />
            </div>
          </div>
        )}
      </div>

      {state === 'expanded' && (
        <AccordionContent className="space-y-2 p-0">
          <div className="flex flex-col gap-1">
            {isLoading ? (
              <div className="space-y-2 py-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 h-8 px-3 animate-pulse"
                  >
                    <div className="h-4 bg-muted rounded w-4/5" />
                    <div className="h-3 bg-muted rounded w-12 ml-auto" />
                  </div>
                ))}
              </div>
            ) : groupedChats ? (
              <>
                <GroupedChats
                  currentChatId={id}
                  lastMessage={recentMessage}
                  chats={groupedChats.today}
                  label={GroupLabel.Today}
                  onClose={() => setOpenMobile(false)}
                />
                <GroupedChats
                  currentChatId={id}
                  lastMessage={recentMessage}
                  chats={groupedChats.yesterday}
                  label={GroupLabel.Yesterday}
                  onClose={() => setOpenMobile(false)}
                />
                <GroupedChats
                  currentChatId={id}
                  lastMessage={recentMessage}
                  chats={groupedChats.lastWeek}
                  label={GroupLabel.LastWeek}
                  onClose={() => setOpenMobile(false)}
                />
                <GroupedChats
                  currentChatId={id}
                  lastMessage={recentMessage}
                  chats={groupedChats.lastMonth}
                  label={GroupLabel.LastMonth}
                  onClose={() => setOpenMobile(false)}
                />
                <GroupedChats
                  currentChatId={id}
                  lastMessage={recentMessage}
                  chats={groupedChats.older}
                  label={GroupLabel.Older}
                  onClose={() => setOpenMobile(false)}
                />
              </>
            ) : null}
          </div>
        </AccordionContent>
      )}
    </AccordionItem>
  );
}

function GroupedChats({
  currentChatId,
  lastMessage,
  chats,
  label,
  onClose,
}: {
  currentChatId?: string;
  lastMessage: Message;
  chats: ChatWithLatestMessage[];
  label: GroupLabel;
  onClose: () => void;
}) {
  if (chats.length === 0) {
    return null;
  }

  const hasLastChatLabel = getMessageDateLabel(lastMessage) === label;

  return (
    <div>
      {!hasLastChatLabel && (
        <div className="px-2 pt-1 text-[0.7rem] text-muted-foreground text-right">
          {label}
        </div>
      )}
      <div className="flex flex-col gap-1 pr-2">
        {chats.map((chat) => (
          <Link
            key={chat.id}
            href={`/chat/${chat.id}`}
            className={cn(
              'flex items-center gap-2 pl-[3.25rem] rounded-md text-muted-foreground hover:text-white transition-colors',
              {
                'text-white': currentChatId === chat.id,
              },
            )}
            onClick={() => onClose()}
          >
            <span className="truncate text-[0.75rem] flex-1">{chat.title}</span>
            <span className="text-[0.7rem] shrink-0">
              {format(new Date(chat.latestMessage.createdAt), 'MMM d')}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
