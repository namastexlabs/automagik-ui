import { throttle } from '@/lib/utils';
import type { Message } from 'ai';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type RefObject,
} from 'react';

export function useScrollToBottom<T extends HTMLElement>(
  messages: Message[],
  isLoading: boolean,
): RefObject<T | null> {
  const containerRef = useRef<T>(null);
  const hasScrolledUpRef = useRef(false);
  const currentScrollTopRef = useRef(0);

  const scrollToBottom = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, []);

  const throttledScrollToBottom = useMemo(
    () =>
      throttle((isLoading: boolean) => {
        if (isLoading && !hasScrolledUpRef.current) {
          scrollToBottom();
        }
      }, 50),
    [scrollToBottom],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const eventHandler = (event: Event) => {
      if (event.target instanceof HTMLElement) {
        if (!isLoading) {
          hasScrolledUpRef.current = false;
          currentScrollTopRef.current = event.target.scrollTop;
          return;
        }

        const isScrollingUp =
          event.target.scrollTop < currentScrollTopRef.current;

        currentScrollTopRef.current = event.target.scrollTop;

        if (!hasScrolledUpRef.current) {
          hasScrolledUpRef.current = isScrollingUp;
        } else if (!isScrollingUp) {
          const isEnd =
            event.target.scrollTop + 50 + event.target.clientHeight >=
            event.target.scrollHeight;

          hasScrolledUpRef.current = !isEnd;
        }
      }
    };

    scrollToBottom();
    container.addEventListener('scroll', eventHandler);

    return () => {
      container.removeEventListener('scroll', eventHandler);
    };
  }, [isLoading, scrollToBottom]);

  useEffect(() => {
    if (isLoading) {
      scrollToBottom();
      hasScrolledUpRef.current = false;
    }
  }, [isLoading, scrollToBottom]);

  useLayoutEffect(() => {
    const observer = new MutationObserver(() => {
      if (containerRef.current) {
        currentScrollTopRef.current = containerRef.current.scrollTop;
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current, { childList: true, subtree: true });
    }

    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    throttledScrollToBottom(isLoading);
  }, [messages, isLoading, throttledScrollToBottom]);

  return containerRef;
}
