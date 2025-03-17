import Script from 'next/script';
import { cookies } from 'next/headers';
import { getUser } from '@/lib/auth';

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AgentTabsProvider } from '@/components/agent-tabs-provider';
import { UserProvider } from '@/components/user-provider';
import { AppSidebar } from '@/components/app-sidebar';
import { AGENT_COOKIE_KEY } from '@/lib/agents/cookies';

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getUser();
  const cookieStore = await cookies();

  const isCollapsed = cookieStore.get('sidebar:state')?.value !== 'true';
  const tabCookie = cookieStore.get(AGENT_COOKIE_KEY)?.value;

  return (
    <UserProvider
      user={{
        id: session.user.id,
        email: session.user.email,
      }}
    >
      <AgentTabsProvider initialTab={tabCookie === '' ? undefined : tabCookie}>
        <SidebarProvider defaultOpen={!isCollapsed}>
          <AppSidebar />
          <SidebarInset>{children}</SidebarInset>
        </SidebarProvider>
      </AgentTabsProvider>
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="beforeInteractive"
      />
    </UserProvider>
  );
}
