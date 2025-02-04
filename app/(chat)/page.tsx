import { cookies } from 'next/headers';

import { auth } from '@/app/(auth)/auth';
import { Chat } from '@/components/chat';
import { DEFAULT_CHAT_MODEL, chatModels } from '@/lib/ai/models';
import { getAgentsByUserId } from '@/lib/db/queries';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { AgentTabsProvider } from '@/components/agent-tabs-provider';
import { AGENT_COOKIE_KEY } from '@/lib/agents/cookies';
import { mapAgent } from '@/lib/data';

export default async function Page() {
  const session = await auth();
  const cookieStore = await cookies();
  const isCollapsed = cookieStore.get('sidebar:state')?.value !== 'true';
  const tabCookie = cookieStore.get(AGENT_COOKIE_KEY)?.value;
  const modelIdFromCookie = cookieStore.get('model-id')?.value;

  const agentsFromDb = session?.user?.id
    ? await getAgentsByUserId({ userId: session?.user.id })
    : [];

  const selectedModelId =
    chatModels.find((model) => model.id === modelIdFromCookie)?.id ||
    DEFAULT_CHAT_MODEL;

  return (
    <AgentTabsProvider initialTab={tabCookie === '' ? undefined : tabCookie}>
      <SidebarProvider defaultOpen={!isCollapsed}>
        <AppSidebar user={session?.user} />
        <SidebarInset>
          <Chat
            initialMessages={[]}
            initialAgents={agentsFromDb.map(mapAgent)}
            selectedModelId={selectedModelId}
            selectedVisibilityType="private"
            isReadonly={false}
          />
        </SidebarInset>
      </SidebarProvider>
    </AgentTabsProvider>
  );
}
