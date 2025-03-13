'use client';

import { useMemo } from 'react';
import { toast } from 'sonner';
import useSWR, { useSWRConfig } from 'swr';

import { updateChatVisibilityAction } from '@/app/(chat)/actions';
import type { VisibilityType } from '@/components/visibility-selector';
import type { Chat } from '@/lib/db/schema';

export function useChatVisibility({
  chatId,
  initialVisibility,
}: {
  chatId?: string;
  initialVisibility: VisibilityType;
}) {
  const { mutate, cache } = useSWRConfig();
  const history: Array<Chat> = cache.get('/api/history')?.data;

  const { data: localVisibility, mutate: setLocalVisibility } = useSWR(
    `${chatId}-visibility`,
    null,
    {
      fallbackData: initialVisibility,
    },
  );

  const visibilityType = useMemo(() => {
    if (!history) return localVisibility;
    const chat = history.find((chat) => chat.id === chatId);
    if (!chat) return 'private';
    return chat.visibility;
  }, [history, chatId, localVisibility]);

  const setVisibilityType = async (updatedVisibilityType: VisibilityType) => {
    if (!chatId) {
      return;
    }
    setLocalVisibility(updatedVisibilityType);

    const response = await updateChatVisibilityAction(
      chatId,
      updatedVisibilityType,
    );

    if (response.errors) {
      toast.error(
        response.errors?._errors?.[0] || 'Failed to update chat visibility',
      );

      setLocalVisibility(localVisibility);
    }

    mutate(`${chatId}-visibility`, updatedVisibilityType);
  };

  return { visibilityType, setVisibilityType };
}
