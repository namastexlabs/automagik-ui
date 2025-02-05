import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

import { auth } from '@/app/(auth)/auth';
import { Chat } from '@/components/chat';
import { DEFAULT_CHAT_MODEL, chatModels } from '@/lib/ai/models';
import {
  getAgentsByUserId,
  getChatById,
  getMessagesByChatId,
} from '@/lib/db/queries';
import { convertToUIMessages } from '@/lib/utils';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { AgentTabsProvider } from '@/components/agent-tabs-provider';
import { mapAgent } from '@/lib/data';
import { DataStreamHandler } from '@/components/data-stream-handler';

export default async function Page({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const chat = await getChatById({ id });

  if (!chat) {
    notFound();
  }

  const session = await auth();


  if (chat.visibility === 'private') {
    if (!session || !session.user) {
      return notFound();
    }

    if (session.user.id !== chat.userId) {
      return notFound();
    }
  }

  const agentsFromDb = session?.user?.id
    ? await getAgentsByUserId({ userId: session?.user.id })
    : [];

  const messagesFromDb = await getMessagesByChatId({
    id,
  });

  const cookieStore = await cookies();
  const isCollapsed = cookieStore.get('sidebar:state')?.value !== 'true';
  const modelIdFromCookie = cookieStore.get('model-id')?.value;
  const selectedChatModelId =
    chatModels.find((model) => model.id === modelIdFromCookie)?.id ||
    DEFAULT_CHAT_MODEL;

  return (
    <AgentTabsProvider>
      <SidebarProvider defaultOpen={!isCollapsed}>
        <AppSidebar user={session?.user} />
        <SidebarInset>
          <Chat
            chat={chat}
            initialAgents={agentsFromDb.map(mapAgent)}
            initialMessages={convertToUIMessages(messagesFromDb)}
            selectedModelId={selectedChatModelId}
            selectedVisibilityType={chat.visibility}
            isReadonly={session?.user?.id !== chat.userId}
          />
        <DataStreamHandler id={id} />
        </SidebarInset>
      </SidebarProvider>
    </AgentTabsProvider>
  );
}
