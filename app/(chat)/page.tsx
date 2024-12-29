import { cookies } from 'next/headers';

import { auth } from '@/app/(auth)/auth';
import { Chat } from '@/components/chat';
import { DEFAULT_MODEL_NAME, models } from '@/lib/ai/models';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { getAgentsByUserId } from '@/lib/db/queries';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { AgentTabsProvider } from '@/components/agent-tabs-provider';
import { AGENT_COOKIE_KEY } from '@/lib/agents/agent-cookies';

export default async function Page() {
  const session = await auth();
  const cookieStore = await cookies();
  const isCollapsed = cookieStore.get('sidebar:state')?.value !== 'true';
  const tabCookie = cookieStore.get(AGENT_COOKIE_KEY)?.value;
  const modelIdFromCookie = cookieStore.get('model-id')?.value;

  const agentsFromDb =
    session?.user?.id ? await getAgentsByUserId({ userId: session?.user.id }) : [];

  const selectedModelId =
    models.find((model) => model.id === modelIdFromCookie)?.id ||
    DEFAULT_MODEL_NAME;

  return (
    <AgentTabsProvider initialTab={tabCookie === '' ? undefined : tabCookie}>
      <SidebarProvider defaultOpen={!isCollapsed}>
        <AppSidebar user={session?.user} />
        <SidebarInset>
          <Chat
            initialMessages={[]}
            initialAgents={agentsFromDb}
            selectedModelId={selectedModelId}
            selectedVisibilityType="private"
            isReadonly={false}
          />
          <DataStreamHandler />
        </SidebarInset>
      </SidebarProvider>
    </AgentTabsProvider>
  );
}
