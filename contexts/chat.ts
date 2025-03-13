import { createContext, use } from 'react';
import type { Attachment, Message } from 'ai';

import type { AgentDTO } from '@/lib/data/agent';
import type { Chat } from '@/lib/db/schema';

export type ChatContextValue = {
  chat?: Chat;
  modelId: string;
  provider: string;
  isLoading: boolean;
  isReadOnly: boolean;
  isImageAllowed: boolean;
  isExtendedThinking: boolean;
  error: string | null;
}

export type ChatInputContextValue = {
  input: string;
  attachments: Attachment[];
};

export type ChatMessagesContextValue = {
  messages: Message[];
};

export type ChatHandlersContextValue = {
  setModelId: (modelId: string) => void;
  setProvider: (provider: string) => void;
  toggleExtendedThinking: () => void;
  setInput: (input: string) => void;
  setAttachments: (attachments: Attachment[]) => void;
  setMessages: (messages: Message[]) => void;
  reload: () => void;
  stop: () => void;
  append: (message: Message) => void;
  handleSubmit: (
    content: string,
    attachments: Attachment[],
    agentId: string,
    agents: AgentDTO[],
    tabs: string[],
  ) => void;
};

export const ChatContext = createContext<ChatContextValue | null>(null);
export const ChatInputContext = createContext<ChatInputContextValue | null>(null);
export const ChatMessagesContext = createContext<ChatMessagesContextValue | null>(null);
export const ChatHandlersContext = createContext<ChatHandlersContextValue | null>(null);

export const useChat = () => {
  const context = use(ChatContext);
  if (context === null) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const useChatInput = () => {
  const context = use(ChatInputContext);
  if (context === null) {
    throw new Error('useChatInput must be used within a ChatProvider');
  }
  return context;
};

export const useChatMessages = () => {
  const context = use(ChatMessagesContext);
  if (context === null) {
    throw new Error('useChatMessages must be used within a ChatProvider');
  }
  return context;
};

export const useChatHandlers = () => {
  const context = use(ChatHandlersContext);
  if (context === null) {
    throw new Error('useChatHandlers must be used within a ChatProvider');
  }
  return context;
};
