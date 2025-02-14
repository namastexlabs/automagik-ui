import { addDays } from 'date-fns';

export const AGENT_COOKIE_KEY = 'agent:tab';

export const setTabCookie = (agentId: string) => {
  document.cookie = `${AGENT_COOKIE_KEY}=${agentId}; expires=${addDays(new Date(), 5).toUTCString()}; path=/`;
};

export const resetTabCookie = () => {
  document.cookie = `${AGENT_COOKIE_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
};
