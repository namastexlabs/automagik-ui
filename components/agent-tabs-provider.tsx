'use client';

import { useMemo, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';
import useSWR from 'swr';

import {
  AgentTabsContext,
  CurrentAgentTabContext,
  type CurrentAgentTabContextValue,
  type AgentTabsContextValue,
} from '@/contexts/agent-tabs';
import { resetTabCookie, setTabCookie } from '@/lib/agents/cookies';
import type { ClientAgent } from '@/lib/data';
import { fetcher } from '@/lib/utils';

export function AgentTabsProvider({
  children,
  initialTab,
}: {
  children: React.ReactNode;
  initialTab?: string;
}) {
  const { data: agents = [] } = useSWR<ClientAgent[]>('/api/agents', fetcher, {
    revalidateOnMount: false,
  });

  const [tabs, setTabs] = useLocalStorage<string[]>('agent-tabs', [], {
    initializeWithValue: false,
  });
  const [currentTab, setTab] = useState<string | null>(initialTab || null);

  const currentTabcontext = useMemo(
    (): CurrentAgentTabContextValue => ({
      currentTab,
      setTab: (id: string | null) => {
        setTab(id);
        if (id) {
          setTabCookie(id);
        } else {
          resetTabCookie();
        }
      },
    }),
    [currentTab],
  );

  const openTabs = useMemo(
    () =>
      tabs
        .filter((tab) => agents.some((a) => a.id === tab))
        .toSorted((a, b) => tabs.indexOf(a) - tabs.indexOf(b)),
    [agents, tabs],
  );

  const tabsContext = useMemo(
    (): AgentTabsContextValue => ({
      tabs: openTabs,
      addTab: (tab: string) =>
        setTabs((state) => Array.from(new Set([...state, tab]))),
      removeTab: (tab: string) =>
        setTabs((state) => state.filter((t) => t !== tab)),
      toggleTab: (tab: string) =>
        setTabs((state) => {
          if (state.includes(tab)) {
            return state.filter((t) => t !== tab);
          } else {
            return [...state, tab];
          }
        }),
    }),
    [openTabs, setTabs],
  );

  return (
    <AgentTabsContext.Provider value={tabsContext}>
      <CurrentAgentTabContext.Provider value={currentTabcontext}>
        {children}
      </CurrentAgentTabContext.Provider>
    </AgentTabsContext.Provider>
  );
}
