import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';

import { auth } from '@/app/(auth)/auth';
import { Chat } from '@/components/chat';
import {
  type ChatModel,
  DEFAULT_CHAT_MODEL,
  DEFAULT_PROVIDER,
  isModelValid,
} from '@/lib/ai/models';
import {
  getAvailableAgents,
  getChatById,
  getMessagesByChatId,
} from '@/lib/db/queries';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { AgentTabsProvider } from '@/components/agent-tabs-provider';
import { mapAgent } from '@/lib/data';
import { UserProvider } from '@/components/user-provider';
import { MODEL_COOKIE_KEY, PROVIDER_COOKIE_KEY } from '@/lib/ai/cookies';
import { convertAttachmentUrls } from '@/lib/utils.server';
import { convertToUIMessages } from '@/lib/utils';

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

  const initialMessages = await Promise.all(
    convertToUIMessages(messagesFromDb).map((message) =>
      convertAttachmentUrls(message, id),
    ),
  );

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
              initialMessages={initialMessages}
              provider={provider}
              modelId={modelId}
              selectedVisibilityType={chat.visibility}
              isReadonly={session?.user?.id !== chat.userId}
            />
          </SidebarInset>
        </SidebarProvider>
      </AgentTabsProvider>
    </UserProvider>
  );
}
