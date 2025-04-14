'use client';

import { Frown, Loader2, Meh, Smile } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getTokenCount } from '@/lib/ai/tokenizer/count-tokens';
import { useDebounceValue } from 'usehooks-ts';
import { useChatInput } from '@/contexts/chat';
import { cn } from '@/lib/utils';

export function TokenCount({ chatTokens }: { chatTokens: number }) {
  const [tokenCount, setTokenCount] = useState(0);
  const { input } = useChatInput();
  const [isLoading, setIsLoading] = useState(false);
  const [debouncedInput] = useDebounceValue(input, 1000);

  useEffect(() => {
    let abort = false;

    if (debouncedInput.length === 0) {
      setTokenCount(0);
    } else {
      setIsLoading(true);
      const tokenCount = async (text: string, abort: boolean) => {
        const data = await getTokenCount(text, abort);
        if (data?.error) {
          console.error(data.error);
        }

        if (!abort && data?.result) {
          setTokenCount(data.result);
          setIsLoading(false);
        }
      };

      tokenCount(debouncedInput, abort);
    }

    return () => {
      abort = true;
    };
  }, [debouncedInput]);

  const tokens = chatTokens + tokenCount;

  return (
    <div
      className={cn(
        'flex items-center gap-1 bg-dark-gray rounded-lg h-full px-3 py-1.5',
        {
          'text-red-500': tokens >= 128000,
          'text-yellow-500': tokens < 128000,
          'text-foreground': tokens < 32000,
        },
      )}
    >
      <span>
        {isLoading ? (
          <Loader2 className="animate-spin" size={20} />
        ) : tokens < 32000 ? (
          <Smile size={20} />
        ) : tokens < 128000 ? (
          <Meh size={20} />
        ) : (
          <Frown size={20} />
        )}
      </span>
      <span>{tokens} tokens</span>
    </div>
  );
}
