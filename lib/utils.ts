import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { toast } from 'sonner';

import type { Document } from '@/lib/db/schema';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const fetcher = async (url: string) => {
  const res = await fetch(url);

  if (!res.ok) {
    const errors = await res.json();

    if (errors._errors) {
      toast.error(errors._errors[0]);
    }

    throw new Error('An error occurred while fetching the data.');
  }

  return res.json();
};

export function getLocalStorage(key: string) {
  if (typeof window !== 'undefined') {
    return JSON.parse(localStorage.getItem(key) || '[]');
  }
  return [];
}

export const toCamelCase = (str: string) => {
  return str.replace(/\s([a-z])/g, (_, char) => char.toUpperCase());
};

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getDocumentTimestampByIndex(
  documents: Array<Document>,
  index: number,
) {
  if (!documents) return new Date();
  if (index > documents.length) return new Date();

  return documents[index].createdAt;
}

export function getDynamicBlockNames(
  isPublic: boolean,
  dynamicBlocks: { name: string; visibility: 'private' | 'public' }[],
) {
  return dynamicBlocks
    .filter(
      ({ visibility }) => visibility === (isPublic ? 'public' : 'private'),
    )
    .map(({ name }) => name);
}

export function validateUUID(id: string) {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
    id,
  );
}

export function throttle<T extends (...args: any[]) => void>(
  func: T,
  wait: number,
) {
  let timeout: NodeJS.Timeout | null = null;
  let lastArgs: any[] | null = null;

  const throttled = (...args: Parameters<T>) => {
    lastArgs = args;

    if (!timeout) {
      const later = () => {
        timeout = null;
        if (lastArgs) {
          func.apply(null, lastArgs);
          lastArgs = null;
        }
      };

      func.apply(null, args);
      timeout = setTimeout(later, wait);
    }
  };

  return throttled;
}
