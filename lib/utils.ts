import type {
  CoreAssistantMessage,
  CoreMessage,
  CoreToolMessage,
  Message,
} from 'ai';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import type { Message as DBMessage, Document } from '@/lib/db/schema';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ApplicationError extends Error {
  info: string;
  status: number;
}

export const fetcher = async (url: string) => {
  const res = await fetch(url);

  if (!res.ok) {
    const error = new Error(
      'An error occurred while fetching the data.',
    ) as ApplicationError;

    error.info = await res.json();
    error.status = res.status;

    throw error;
  }

  return res.json();
};

export function getLocalStorage(key: string) {
  if (typeof window !== 'undefined') {
    return JSON.parse(localStorage.getItem(key) || '[]');
  }
  return [];
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function convertToUIMessages(messages: Array<DBMessage>): Message[] {
  return messages.map((dbMessage): Message => {
    return {
      id: dbMessage.id,
      role: dbMessage.role,
      createdAt: dbMessage.createdAt,
      ...dbMessage.content,
    };
  });
}

type ResponseMessageWithoutId = CoreToolMessage | CoreAssistantMessage;
type ResponseMessage = ResponseMessageWithoutId & { id: string };

export function sanitizeResponseMessages({
  messages,
}: {
  messages: ResponseMessage[];
}): ResponseMessage[] {
  const toolResultIds: Array<string> = [];

  for (const message of messages) {
    if (message.role === 'tool') {
      for (const content of message.content) {
        if (content.type === 'tool-result') {
          toolResultIds.push(content.toolCallId);
        }
      }
    }
  }

  const messagesBySanitizedContent = messages.map((message) => {
    if (message.role !== 'assistant') return message;

    if (typeof message.content === 'string') return message;

    const sanitizedContent = message.content.filter((content) =>
      content.type === 'tool-call'
        ? toolResultIds.includes(content.toolCallId)
        : content.type === 'text' || content.type === 'reasoning'
          ? content.text.length > 0
          : true,
    );

    return {
      ...message,
      content: sanitizedContent,
    };
  });

  return messagesBySanitizedContent.filter(
    (message) => message.content.length > 0,
  );
}

export function getMostRecentUserMessage(messages: Array<CoreMessage>) {
  const userMessages = messages.filter((message) => message.role === 'user');
  return userMessages.at(-1);
}

export function hasAttachment(messages: Message[]) {
  return messages.some(
    (message) =>
      message.role === 'user' &&
      message.experimental_attachments &&
      message.experimental_attachments.length > 0,
  );
}

export function getDocumentTimestampByIndex(
  documents: Array<Document>,
  index: number,
) {
  if (!documents) return new Date();
  if (index > documents.length) return new Date();

  return documents[index].createdAt;
}

export function getDiffRelation<PREVIOUS, CURRENT>(
  prevItems: PREVIOUS[],
  items: CURRENT[],
  equalTo: (a: PREVIOUS, b: CURRENT) => boolean,
) {
  const newItems = items.filter(
    (item) => !prevItems.some((prevItem) => equalTo(prevItem, item)),
  );
  const deletedItems = prevItems.filter(
    (prevItem) => !items.some((item) => equalTo(prevItem, item)),
  );

  return [deletedItems, newItems] as const;
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
