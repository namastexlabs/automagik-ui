'use client'

import { useMemo, useState } from "react";
import { useLocalStorage } from "usehooks-ts";

import {
  AgentTabsContext,
  CurrentAgentTabContext,
  type CurrentAgentTabContextValue,
  type AgentTabsContextValue,
} from '@/contexts/agent-tabs';
import { resetTabCookie, setTabCookie } from '@/lib/agents/cookies';

export function AgentTabsProvider({
  children,
  initialTab,
}: { children: React.ReactNode; initialTab?: string }) {
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

  const tabsContext = useMemo((): AgentTabsContextValue => ({
    tabs,
    addTab: (tab: string) => setTabs((state) => [...state, tab]),
    removeTab: (tab: string) => setTabs(
      (state) => state.filter((t) => t !== tab)
    ),
  }), [tabs, setTabs]);

  return (
    <AgentTabsContext.Provider value={tabsContext}>
      <CurrentAgentTabContext.Provider value={currentTabcontext}>
        {children}
      </CurrentAgentTabContext.Provider>
    </AgentTabsContext.Provider>
  )
}