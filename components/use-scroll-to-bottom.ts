import type { Message } from 'ai';
import { useEffect, useRef, type RefObject } from 'react';

export function useScrollToBottom<T extends HTMLElement>(
  messages: Message[],
): RefObject<T | null> {
  const endRef = useRef<T>(null);

  useEffect(() => {
    const end = endRef.current;

    if (end) {
      end.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return endRef;
}
