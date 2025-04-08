import useSWR from 'swr';
import { useCallback } from 'react';

import type { Agent } from '@/lib/db/schema';

export type CurrentAgent = Omit<Agent, 'systemPrompt'>;

export function useCurrentAgent() {
  const { data: agent, mutate } = useSWR<CurrentAgent | null>(
    '_currentAgent',
    null,
  );

  const updateAgent = useCallback(
    (newAgent: CurrentAgent | null) => {
      mutate(newAgent);
    },
    [mutate],
  );

  return { agent, updateAgent };
}
