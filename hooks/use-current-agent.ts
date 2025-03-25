import useSWR from 'swr';
import { useCallback } from 'react';

import type { VisibilityType } from '@/components/visibility-selector';

export type CurrentAgent = {
  id: string;
  name: string;
  avatarUrl: string | null;
  visibility: VisibilityType;
  userId: string | null;
};

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
