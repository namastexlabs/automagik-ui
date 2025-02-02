import { createContext, use } from 'react';

export interface AgentTabsContextValue {
  tabs: string[];
  addTab: (tab: string) => void;
  removeTab: (tab: string) => void;
  toggleTab: (tab: string) => void;
}

export interface CurrentAgentTabContextValue {
  currentTab: string | null;
  setTab: (tab: string | null) => void;
}

export const CurrentAgentTabContext =
  createContext<CurrentAgentTabContextValue | null>(null);
export const AgentTabsContext = createContext<AgentTabsContextValue | null>(
  null,
);

export const useAgentTabs = () => {
  const context = use(AgentTabsContext);

  if (context === null) {
    throw new Error('useAgentTabs must be used within a AgentTabsProvider');
  }

  return context;
};

export const useCurrentAgentTab = () => {
  const context = use(CurrentAgentTabContext);

  if (context === null) {
    throw new Error(
      'useCurrentAgentTab must be used within a AgentTabsProvider',
    );
  }

  return context;
};
