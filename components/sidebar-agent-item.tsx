'use client';

import useSWR from 'swr';
import {
  isYesterday,
  isToday,
  isSameWeek,
  isSameMonth,
  subWeeks,
  subMonths,
} from 'date-fns';
import {
  TrashIcon,
  GlobeIcon,
  LockIcon,
  MoreHorizontalIcon,
  ShareIcon,
  SearchIcon,
} from 'lucide-react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import type { Chat, Message } from '@/lib/db/schema';
import { useUser } from '@/contexts/user';
import type { AgentWithMessagesDTO } from '@/lib/data/agent';
import { cn, fetcher } from '@/lib/utils';
import { useCurrentAgentTab } from '@/contexts/agent-tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useChatVisibility } from '@/hooks/use-chat-visibility';
import {
  SidebarMenuAction,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
  SidebarGroup,
  SidebarGroupContent,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CheckCircleFillIcon } from '@/components/icons';
import { Input } from '@/components/ui/input';

type GroupedChats = {
  today: Chat[];
  yesterday: Chat[];
  lastWeek: Chat[];
  lastMonth: Chat[];
  older: Chat[];
};

type AgentItemProps = {
  agent: AgentWithMessagesDTO;
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

const ChatItem = ({
  chat,
  isActive,
  onDelete,
  setOpenMobile,
}: {
  chat: Chat;
  isActive: boolean;
  onDelete: (chatId: string) => void;
  setOpenMobile: (open: boolean) => void;
}) => {
  const { visibilityType, setVisibilityType } = useChatVisibility({
    chatId: chat.id,
    initialVisibility: chat.visibility,
  });

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive}>
        <Link href={`/chat/${chat.id}`} onClick={() => setOpenMobile(false)}>
          <span>{chat.title}</span>
        </Link>
      </SidebarMenuButton>

      <DropdownMenu modal={true}>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground mr-0.5"
            showOnHover={!isActive}
          >
            <MoreHorizontalIcon />
            <span className="sr-only">More</span>
          </SidebarMenuAction>
        </DropdownMenuTrigger>

        <DropdownMenuContent side="bottom" align="end">
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="cursor-pointer">
              <ShareIcon />
              <span>Share</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem
                  className="cursor-pointer flex-row justify-between"
                  onClick={() => {
                    setVisibilityType('private');
                  }}
                >
                  <div className="flex flex-row gap-2 items-center">
                    <LockIcon size={12} />
                    <span>Private</span>
                  </div>
                  {visibilityType === 'private' ? (
                    <CheckCircleFillIcon />
                  ) : null}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer flex-row justify-between"
                  onClick={() => {
                    setVisibilityType('public');
                  }}
                >
                  <div className="flex flex-row gap-2 items-center">
                    <GlobeIcon />
                    <span>Public</span>
                  </div>
                  {visibilityType === 'public' ? <CheckCircleFillIcon /> : null}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>

          <DropdownMenuItem
            className="cursor-pointer text-destructive focus:bg-destructive/15 focus:text-destructive dark:text-red-500"
            onSelect={() => onDelete(chat.id)}
          >
            <TrashIcon />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
};

export function SidebarAgentItem({ agent, onDelete }: AgentItemProps) {
  const { currentTab } = useCurrentAgentTab();
  const { user } = useUser();
  const { setOpenMobile } = useSidebar();
  const { id } = useParams();
  const [randomColor, setRandomColor] = useState<string>();
  const { data: history, isLoading } = useSWR<Array<Chat>>(
    user && currentTab === agent.id ? `/api/history?agentId=${agent.id}` : null,
    fetcher,
    {
      fallbackData: [],
      revalidateOnFocus: false,
    },
  );

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

  return (
    <div
      className={cn(
        'flex items-center gap-2 p-2 rounded-md hover:bg-dark-gray transition-colors',
        {
          'bg-dark-gray': id === agent.chat.id,
        },
      )}
    >
      <div className="rounded-full shrink-0">
        <Avatar className="size-9 text-md font-bold">
          <AvatarImage src={agent.avatarUrl || undefined} alt={agent.name} />
          <AvatarFallback className={randomColor}>
            {agent.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>
      <div className="flex flex-col flex-1 min-w-0 gap-1">
        <div className="flex justify-between items-center">
          <p className="text-foreground font-bold text-sm max-w-[7.8rem] truncate">
            {agent.name}
          </p>
          <span className="text-[0.7rem] text-muted-foreground">
            {getMessageDateLabel(agent.recentMessage)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground truncate w-[70%]">
          {agent.recentMessage.content.content}
        </p>
      </div>
      {false && (
        <SidebarGroup>
          <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
            Today
          </div>
          <SidebarGroupContent>
            <div className="flex flex-col">
              {[44, 32, 28, 64, 52].map((item) => (
                <div
                  key={item}
                  className="rounded-md h-8 flex gap-2 px-2 items-center"
                >
                  <div
                    className="h-4 rounded-md flex-1 max-w-[--skeleton-width] bg-sidebar-accent-foreground/10"
                    style={
                      {
                        '--skeleton-width': `${item}%`,
                      } as React.CSSProperties
                    }
                  />
                </div>
              ))}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      )}
      {false &&
        history &&
        (history as Chat[]).length > 0 &&
        (() => {
          const groupedChats = groupChatsByDate(history as Chat[]);

          return (
            <>
              <div className="relative mb-2">
                <Input
                  type="text"
                  placeholder="Search for agents"
                  className="pl-8"
                  onChange={(e) => {
                    console.log(e.target.value);
                  }}
                />
                <SearchIcon
                  size={20}
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
              </div>
              {groupedChats.today.length > 0 && (
                <>
                  <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
                    Today
                  </div>
                  {groupedChats.today.map((chat) => (
                    <ChatItem
                      key={chat.id}
                      chat={chat}
                      isActive={chat.id === id}
                      onDelete={onDelete}
                      setOpenMobile={setOpenMobile}
                    />
                  ))}
                </>
              )}

              {groupedChats.yesterday.length > 0 && (
                <>
                  <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
                    Yesterday
                  </div>
                  {groupedChats.yesterday.map((chat) => (
                    <ChatItem
                      key={chat.id}
                      chat={chat}
                      isActive={chat.id === id}
                      onDelete={onDelete}
                      setOpenMobile={setOpenMobile}
                    />
                  ))}
                </>
              )}

              {groupedChats.lastWeek.length > 0 && (
                <>
                  <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
                    Last 7 days
                  </div>
                  {groupedChats.lastWeek.map((chat) => (
                    <ChatItem
                      key={chat.id}
                      chat={chat}
                      isActive={chat.id === id}
                      onDelete={onDelete}
                      setOpenMobile={setOpenMobile}
                    />
                  ))}
                </>
              )}

              {groupedChats.lastMonth.length > 0 && (
                <>
                  <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
                    Last 30 days
                  </div>
                  {groupedChats.lastMonth.map((chat) => (
                    <ChatItem
                      key={chat.id}
                      chat={chat}
                      isActive={chat.id === id}
                      onDelete={onDelete}
                      setOpenMobile={setOpenMobile}
                    />
                  ))}
                </>
              )}

              {groupedChats.older.length > 0 && (
                <>
                  <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
                    Older
                  </div>
                  {groupedChats.older.map((chat) => (
                    <ChatItem
                      key={chat.id}
                      chat={chat}
                      isActive={chat.id === id}
                      onDelete={onDelete}
                      setOpenMobile={setOpenMobile}
                    />
                  ))}
                </>
              )}
            </>
          );
        })()}
    </div>
  );
}
