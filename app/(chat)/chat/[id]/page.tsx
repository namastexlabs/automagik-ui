import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';

import { auth } from '@/app/(auth)/auth';
import { Chat } from '@/components/chat';
import { DEFAULT_CHAT_MODEL, chatModels } from '@/lib/ai/models';
import {
  getAvailableAgents,
  getChatById,
  getMessagesByChatId,
} from '@/lib/db/queries';
import { convertToUIMessages } from '@/lib/utils';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { AgentTabsProvider } from '@/components/agent-tabs-provider';
import { mapAgent } from '@/lib/data';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { UserProvider } from '@/components/user-provider';

export default async function Page({
  params,
}: { params: Promise<{ id: string }> }) {
  const session = await auth();

  if (!session || !session.user) {
    return redirect('/login');
  }

  const { id } = await params;
  const chat = await getChatById({ id });

  if (!chat) {
    notFound();
  }

  if (!session || !session.user) {
    return redirect('/login');
  }

  if (chat.visibility === 'private') {
    if (session.user.id !== chat.userId) {
      return notFound();
    }
  }
  // biome-ignore lint/style/noNonNullAssertion: <explanation>
  const userId = session.user.id!;

  const agentsFromDb = session?.user?.id
    ? await getAvailableAgents({ userId: session?.user.id })
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
    <UserProvider
      user={{
        id: userId,
        // biome-ignore lint/style/noNonNullAssertion: <explanation>
        email: session!.user!.email!,
      }}
    >
      <AgentTabsProvider>
        <SidebarProvider defaultOpen={!isCollapsed}>
          <AppSidebar />
          <SidebarInset>
            <Chat
              chat={chat}
              initialAgents={agentsFromDb.map((agent) =>
                mapAgent(userId, agent),
              )}
              initialMessages={convertToUIMessages(messagesFromDb)}
              selectedModelId={selectedChatModelId}
              selectedVisibilityType={chat.visibility}
              isReadonly={session?.user?.id !== chat.userId}
            />
            <DataStreamHandler id={id} />
          </SidebarInset>
        </SidebarProvider>
      </AgentTabsProvider>
    </UserProvider>
  );
}
