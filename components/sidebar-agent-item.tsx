'use client';

import useSWR from 'swr';
import {
  isYesterday,
  isToday,
  isSameWeek,
  isSameMonth,
  subWeeks,
  subMonths,
  format,
} from 'date-fns';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import type { Chat, Message } from '@/lib/db/schema';
import type { AgentWithMessagesDTO } from '@/lib/data/agent';
import { cn, fetcher } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion';
import { useSidebar } from './ui/sidebar';

type GroupedChats = {
  today: Chat[];
  yesterday: Chat[];
  lastWeek: Chat[];
  lastMonth: Chat[];
  older: Chat[];
};

type AgentItemProps = {
  agent: AgentWithMessagesDTO;
  isOpen: boolean;
  onDelete: (chatId: string) => void;
};

const colors = [
  'bg-red-500',
  'bg-blue-500',
  'bg-green-500',
  'bg-yellow-500',
  'bg-purple-500',
  'bg-pink-500',
];

function getRandomColor() {
  return colors[Math.floor(Math.random() * colors.length)];
}

const getMessageDateLabel = (message: Message) => {
  const now = new Date();
  const messageDate = new Date(message.createdAt);

  if (isToday(messageDate)) {
    return 'Today';
  } else if (isYesterday(messageDate)) {
    return 'Yesterday';
  } else if (isSameWeek(messageDate, now)) {
    return 'Last week';
  } else if (isSameMonth(messageDate, now)) {
    return 'Last month';
  } else {
    return 'Older';
  }
};

export function SidebarAgentItem({ agent, isOpen }: AgentItemProps) {
  const { setOpenMobile, state } = useSidebar();
  const { id } = useParams();
  const [randomColor, setRandomColor] = useState<string>();

  // Only fetch when expanded and open
  const {
    data: history,
    isLoading,
    mutate,
  } = useSWR<Array<Chat>>(
    `/api/history?agentId=${agent.id}`,
    isOpen ? fetcher : null,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
    },
  );

  useEffect(() => {
    if (isOpen) {
      mutate();
    }
  }, [isOpen, mutate]);

  useEffect(() => {
    setRandomColor(getRandomColor());
  }, []);

  const groupChatsByDate = (chats: Chat[]): GroupedChats => {
    const now = new Date();
    const oneWeekAgo = subWeeks(now, 1);
    const oneMonthAgo = subMonths(now, 1);

    return chats.reduce(
      (groups, chat) => {
        const chatDate = new Date(chat.createdAt);

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

  const groupedChats = useMemo(() => {
    if (!history) return null;
    return groupChatsByDate(history);
  }, [history]);

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
          'flex items-center gap-2 p-2 rounded-md hover:bg-dark-gray transition-colors w-full',
          {
            'bg-dark-gray': id === agent.chat.id,
            '!bg-transparent p-0 justify-center': state === 'collapsed',
          },
        )}
      >
        <Link href={`/chat/${agent.chat.id}`}>
          <div className="rounded-full shrink-0">
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
          <div className="flex flex-col flex-1 min-w-0 gap-1">
            <Link href={`/chat/${agent.chat.id}`}>
              <div className="flex justify-between items-center">
                <p className="text-foreground font-bold text-sm max-w-40 truncate">
                  {agent.name}
                </p>
                <span className="text-[0.7rem] text-muted-foreground">
                  {getMessageDateLabel(agent.recentMessage)}
                </span>
              </div>
            </Link>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground truncate w-4/5">
                <Link href={`/chat/${agent.chat.id}`}>
                  {agent.recentMessage.content.content}
                </Link>
              </p>
              <AccordionTrigger className="p-0" />
            </div>
          </div>
        )}
      </div>

      {state === 'expanded' && (
        <AccordionContent className="space-y-2 p-0">
          <div className="flex flex-col gap-3">
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
                {groupedChats.today.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-xs text-muted-foreground text-right">
                      Today
                    </div>
                    <div className="flex flex-col gap-1 pl-12 pr-4">
                      {groupedChats.today.map((chat) => (
                        <HistoryItem
                          key={chat.id}
                          chat={chat}
                          isActive={chat.id === id}
                          onClose={() => setOpenMobile(false)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {groupedChats.yesterday.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-xs text-muted-foreground text-right">
                      Yesterday
                    </div>
                    <div className="flex flex-col gap-1 pl-12 pr-4">
                      {groupedChats.yesterday.map((chat) => (
                        <HistoryItem
                          key={chat.id}
                          chat={chat}
                          isActive={chat.id === id}
                          onClose={() => setOpenMobile(false)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {groupedChats.lastWeek.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-xs text-muted-foreground text-right">
                      Last 7 days
                    </div>
                    <div className="flex flex-col gap-1 pl-12 pr-4">
                      {groupedChats.lastWeek.map((chat) => (
                        <HistoryItem
                          key={chat.id}
                          chat={chat}
                          isActive={chat.id === id}
                          onClose={() => setOpenMobile(false)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {groupedChats.lastMonth.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-xs text-muted-foreground text-right">
                      Last 30 days
                    </div>
                    <div className="flex flex-col gap-1 pl-12 pr-4">
                      {groupedChats.lastMonth.map((chat) => (
                        <HistoryItem
                          key={chat.id}
                          chat={chat}
                          isActive={chat.id === id}
                          onClose={() => setOpenMobile(false)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {groupedChats.older.length > 0 && (
                  <div>
                    <div className="px-2 py-1 text-xs text-muted-foreground text-right">
                      Older
                    </div>
                    <div className="flex flex-col gap-1 pl-12 pr-4">
                      {groupedChats.older.map((chat) => (
                        <HistoryItem
                          key={chat.id}
                          chat={chat}
                          isActive={chat.id === id}
                          onClose={() => setOpenMobile(false)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </AccordionContent>
      )}
    </AccordionItem>
  );
}

function HistoryItem({
  chat,
  isActive,
  onClose,
}: {
  chat: Chat;
  isActive: boolean;
  onClose: () => void;
}) {
  return (
    <Link
      href={`/chat/${chat.id}`}
      className={cn(
        'flex items-center gap-2 rounded-md text-muted-foreground hover:text-white transition-colors',
        {
          'text-white': isActive,
        },
      )}
      onClick={onClose}
    >
      <span className="truncate text-[0.8rem] flex-1">{chat.title}</span>
      <span className="text-[0.7rem] shrink-0">
        {format(new Date(chat.createdAt), 'MMM d')}
      </span>
    </Link>
  );
}
