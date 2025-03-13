import { z } from 'zod';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

import { getUser } from '@/lib/auth';
import { Chat } from '@/components/chat';
import {
  type ChatModel,
  DEFAULT_CHAT_MODEL,
  DEFAULT_PROVIDER,
  isModelValid,
} from '@/lib/ai/models';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { AgentTabsProvider } from '@/components/agent-tabs-provider';
import { UserProvider } from '@/components/user-provider';
import { MODEL_COOKIE_KEY, PROVIDER_COOKIE_KEY } from '@/lib/ai/cookies';
import { getInitialAgents } from '@/lib/data/agent';
import { getChat } from '@/lib/data/chat';
import { DataStatus } from '@/lib/data';
import { getChatMessages } from '@/lib/data/message';

export default async function Page({
  params,
}: { params: Promise<{ id: string }> }) {
  const session = await getUser();
  const { id } = await params;

  if (!z.string().uuid().safeParse(id).success) {
    notFound();
  }

  const chatData = await getChat(id);

  if (chatData.status === DataStatus.NotFound) {
    notFound();
  }

  const agentsData = await getInitialAgents();
  const messagesData = await getChatMessages(id);

  const error = [
    ...(chatData.errors?._errors ?? []),
    ...(agentsData.errors?._errors ?? []),
    ...(messagesData.errors?._errors ?? []),
  ];

  if (error.length > 0) {
    throw new Error(JSON.stringify(error));
  }

  const chat = chatData.data;
  const agents = agentsData.data;
  const messages = messagesData.data;

  const isChatOwner = session.user.id === chat.userId;
  const currentAgent = agents.find((agent) => agent.id === chat.agentId);
  const isAgentReadOnly =
    currentAgent?.visibility === 'private' &&
    currentAgent?.userId !== session.user.id;

  const cookieStore = await cookies();
  const isCollapsed = cookieStore.get('sidebar:state')?.value !== 'true';
  const providerFromCookie = cookieStore.get(PROVIDER_COOKIE_KEY)
    ?.value as keyof ChatModel;
  const modelIdFromCookie = cookieStore.get(MODEL_COOKIE_KEY)
    ?.value as keyof ChatModel[typeof providerFromCookie];

  const [provider, modelId] =
    providerFromCookie &&
    modelIdFromCookie &&
    isModelValid(providerFromCookie, modelIdFromCookie)
      ? [providerFromCookie, modelIdFromCookie]
      : [DEFAULT_PROVIDER, DEFAULT_CHAT_MODEL];

  return (
    <UserProvider
      user={{
        id: session.user.id,
        email: session.user.email,
      }}
    >
      <AgentTabsProvider>
        <SidebarProvider defaultOpen={!isCollapsed}>
          <AppSidebar />
          <SidebarInset>
            <Chat
              chat={chat}
              initialAgents={agents}
              initialMessages={messages}
              provider={provider}
              modelId={modelId}
              selectedVisibilityType={chat.visibility}
              isReadonly={!isChatOwner || isAgentReadOnly}
            />
          </SidebarInset>
        </SidebarProvider>
      </AgentTabsProvider>
    </UserProvider>
  );
}
