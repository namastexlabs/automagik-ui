import useSWR from 'swr';
import { useCallback } from 'react';

import type { Agent } from '@/lib/db/schema';

export type CurrentAgent = Omit<Agent, 'systemPrompt'>;

export function useCurrentAgent() {
  const { data: agent, mutate } = useSWR<CurrentAgent>('_currentAgent', null);

  const updateAgent = useCallback(
    (newAgent: CurrentAgent) => {
      mutate(newAgent);
    },
    [mutate],
  );

  return { agent, updateAgent };
}
