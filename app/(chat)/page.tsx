import { cookies } from 'next/headers';

import { auth } from '@/app/(auth)/auth';
import { Chat } from '@/components/chat';
import { DEFAULT_MODEL_NAME, models } from '@/lib/ai/models';
import { getAgentsByUserId } from '@/lib/db/queries';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';

export default async function Page() {
  const session = await auth();
  const cookieStore = await cookies();
  const isCollapsed = cookieStore.get('sidebar:state')?.value !== 'true';
  const modelIdFromCookie = cookieStore.get('model-id')?.value;

  const agentsFromDb =
    session?.user?.id ? await getAgentsByUserId({ userId: session?.user.id }) : [];

  const selectedModelId =
    models.find((model) => model.id === modelIdFromCookie)?.id ||
    DEFAULT_MODEL_NAME;

  return (
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
      </SidebarInset>
    </SidebarProvider>
  );
}
