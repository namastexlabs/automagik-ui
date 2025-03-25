import Script from 'next/script';
import type { ReactNode } from 'react';
import { cookies } from 'next/headers';

import { getUser } from '@/lib/auth';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { UserProvider } from '@/components/user-provider';
import { AppSidebar } from '@/components/app-sidebar';
import { getMostRecentAgents } from '@/lib/data/agent';

export default async function Layout({ children }: { children: ReactNode }) {
  const session = await getUser();
  const cookieStore = await cookies();
  const agents = await getMostRecentAgents();

  if (agents.errors) {
    throw new Error(JSON.stringify(agents.errors));
  }

  const isCollapsed = cookieStore.get('sidebar:state')?.value !== 'true';

  return (
    <UserProvider
      user={{
        id: session.user.id,
        email: session.user.email,
      }}
    >
      <SidebarProvider defaultOpen={true}>
        <AppSidebar initialAgents={agents.data} />
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="beforeInteractive"
      />
    </UserProvider>
  );
}
