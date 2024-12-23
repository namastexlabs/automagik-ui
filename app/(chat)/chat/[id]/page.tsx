import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

import { auth } from '@/app/(auth)/auth';
import { Chat } from '@/components/chat';
import { DEFAULT_MODEL_NAME, models } from '@/lib/ai/models';
import { getAgentsByUserId, getChatById, getMessagesByChatId } from '@/lib/db/queries';
import { convertToUIMessages } from '@/lib/utils';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const chat = await getChatById({ id });

  if (!chat) {
    notFound();
  }

  const session = await auth();

  
  if (session?.user?.id !== chat.userId) {
    return notFound();
  }

  const agentsFromDb =
    session?.user?.id ? await getAgentsByUserId({ userId: session?.user.id }) : [];

  const messagesFromDb = await getMessagesByChatId({
    id,
  });

  const cookieStore = await cookies();
  const isCollapsed = cookieStore.get('sidebar:state')?.value !== 'true';
  const modelIdFromCookie = cookieStore.get('model-id')?.value;
  const selectedModelId =
    models.find((model) => model.id === modelIdFromCookie)?.id ||
    DEFAULT_MODEL_NAME;

  return (
    <SidebarProvider defaultOpen={!isCollapsed}>
      <AppSidebar user={session?.user} initialChat={chat} />
      <SidebarInset>
        <Chat
          initialChat={chat}
          initialAgents={agentsFromDb}
          initialMessages={convertToUIMessages(messagesFromDb)}
          selectedModelId={selectedModelId}
          selectedVisibilityType={chat.visibility}
          isReadonly={session?.user?.id !== chat.userId}
        />
      </SidebarInset>
  </SidebarProvider>
  );
}
