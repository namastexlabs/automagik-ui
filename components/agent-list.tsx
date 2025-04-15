'use client';

import { useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import useSWRInfinite from 'swr/infinite';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bot, LoaderIcon } from 'lucide-react';
import type { AgentDTO } from '@/lib/data/agent';
import { fetcher } from '@/lib/utils';
import { useUser } from '@/contexts/user';

interface AgentListProps {
  initialAgents: AgentDTO[];
}

export function AgentList({ initialAgents }: AgentListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const perPage = 4;
  const getKey = useCallback(
    (pageIndex: number, previousPageData: AgentDTO[]) => {
      if (previousPageData && !previousPageData.length) return null;
      return ['api/agents', pageIndex + 1, perPage];
    },
    [perPage],
  );

  const { user } = useUser();

  const { data, size, setSize, isLoading } = useSWRInfinite<AgentDTO[]>(
    getKey,
    ([url, pageIndex, limit]) =>
      fetcher(`${url}?page=${pageIndex}&limit=${limit}`),
    {
      fallbackData: [initialAgents],
      revalidateFirstPage: false,
      revalidateOnMount: false,
      initialSize: 1,
    },
  );

  const agents = data ? data.flat() : [];
  const isEmpty = data?.[0]?.length === 0;
  const isReachingEnd =
    isEmpty || (data && data[data.length - 1]?.length < perPage);
  const isLoadingMore =
    isLoading || (size > 0 && data && typeof data[size - 1] === 'undefined');

  useEffect(() => {
    const currentRef = bottomRef.current;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    if (!isReachingEnd && !isLoadingMore && currentRef) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && !isLoadingMore && !isReachingEnd) {
            setSize((prev) => prev + 1);
          }
        },
        {
          rootMargin: '100px',
          threshold: 0.1,
        },
      );

      observerRef.current.observe(currentRef);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [isReachingEnd, isLoadingMore, setSize]);

  return (
    <div className="flex flex-col gap-10 pt-6 pb-16">
      {agents.map((agent) => (
        <Link
          key={agent.id}
          href={agent.userId !== user?.id ? `/chat?agent=${agent.id}` : `/agents/${agent.id}`}
          className="flex items-center gap-1 rounded-lg transition-colors"
        >
          <Avatar className="size-24 mr-4">
            <AvatarImage
              src={agent.avatarUrl ?? undefined}
              className="object-cover"
            />
            <AvatarFallback>
              <Bot className="size-12" />
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <h3 className="font-medium text-xl">{agent.name}</h3>
            <p className="text-muted-foreground whitespace-pre-wrap text max-w-[700px] line-clamp-4">
              {agent.description}
            </p>
          </div>
        </Link>
      ))}
      <div ref={bottomRef} className="col-span-full flex justify-center p-4">
        {isLoadingMore ? (
          <div className="animate-spin">
            <LoaderIcon className="size-6" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
