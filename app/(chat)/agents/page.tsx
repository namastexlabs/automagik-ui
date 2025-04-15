import Link from 'next/link';
import { Plus } from 'lucide-react';

import { getAgents } from '@/lib/data/agent';
import { AgentList } from '@/components/agent-list';
import {
  Breadcrumb,
  BreadcrumbSeparator,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbLink,
} from '@/components/ui/breadcrumb';

export default async function AgentListPage() {
  const { data: initialAgents } = await getAgents(1, 4);

  return (
    <div className="flex flex-col h-full bg-black-white-gradient border-none">
      <header>
        <div className="container flex items-center h-14 px-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/agents" className="font-bold">
                  Agents
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-bold">
                  Agents List
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <main className="pt-12 mx-auto container">
        <div className="mx-16">
          <div className="flex items-center justify-between border-b border-muted pb-4">
            <h1 className="text-3xl">Explore AI Agents</h1>
            <Link href="/agents/new" className="flex gap-2 text-md">
              <Plus /> Create New Agent
            </Link>
          </div>
          <AgentList initialAgents={initialAgents} />
        </div>
      </main>
    </div>
  );
}
