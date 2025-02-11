import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { auth } from '@/app/(auth)/auth';
import { Chat } from '@/components/chat';
import { DEFAULT_CHAT_MODEL, chatModels } from '@/lib/ai/models';
import { getAvailableAgents } from '@/lib/db/queries';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { AgentTabsProvider } from '@/components/agent-tabs-provider';
import { AGENT_COOKIE_KEY } from '@/lib/agents/cookies';
import { mapAgent } from '@/lib/data';
import { UserProvider } from '@/components/user-provider';

export default async function Page() {
  const session = await auth();

  if (!session || !session.user) {
    return redirect('/login');
  }

  // biome-ignore lint/style/noNonNullAssertion: <explanation>
  const userId = session.user.id!;
  const cookieStore = await cookies();
  const agentsFromDb = await getAvailableAgents({ userId });
  const isCollapsed = cookieStore.get('sidebar:state')?.value !== 'true';
  const tabCookie = cookieStore.get(AGENT_COOKIE_KEY)?.value;
  const modelIdFromCookie = cookieStore.get('model-id')?.value;

  const selectedModelId =
    chatModels.find((model) => model.id === modelIdFromCookie)?.id ||
    DEFAULT_CHAT_MODEL;

  return (
    <UserProvider
      user={{
        id: userId,
        // biome-ignore lint/style/noNonNullAssertion: <explanation>
        email: session.user.email!,
      }}
    >
      <AgentTabsProvider initialTab={tabCookie === '' ? undefined : tabCookie}>
        <SidebarProvider defaultOpen={!isCollapsed}>
          <AppSidebar />
          <SidebarInset>
            <Chat
              initialMessages={[]}
              initialAgents={agentsFromDb.map((agent) =>
                mapAgent(userId, agent),
              )}
              selectedModelId={selectedModelId}
              selectedVisibilityType="private"
              isReadonly={false}
            />
          </SidebarInset>
        </SidebarProvider>
      </AgentTabsProvider>
    </UserProvider>
  );
}
