import { notFound } from 'next/navigation';
import { z } from 'zod';
import { Bot } from 'lucide-react';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { getAgentWithSystemPrompt } from '@/lib/data/agent';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getUser } from '@/lib/auth';
import { AgentForm } from '@/components/agent-form';
import { getInitialTools } from '@/lib/data/tool';
import { SWRConfig } from 'swr';

export default async function AgentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!z.string().uuid().safeParse(id).success) {
    notFound();
  }

  const session = await getUser();
  const { data: tools, errors: toolsErrors } = await getInitialTools();
  const { data: agent, errors } = await getAgentWithSystemPrompt(id);

  if (errors || !agent || toolsErrors) {
    throw new Error('Something went wrong');
  }

  const isEditable = session.user.id === agent.userId;

  return (
    <div className="flex flex-col h-full bg-black-white-gradient border-none">
      <header>
        <div className="container flex items-center h-16 px-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/agents" className="font-bold">
                  Agents
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <Avatar>
                  <AvatarImage
                    className="object-cover"
                    src={agent.avatarUrl ?? undefined}
                  />
                  <AvatarFallback className="bg-transparent">
                    <Bot />
                  </AvatarFallback>
                </Avatar>
                <BreadcrumbPage className="font-bold">
                  {agent.name}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center mx-auto py-6 max-w-[800px] w-[80vw]">
        <SWRConfig value={{ fallback: { '/api/tools': tools } }}>
          <AgentForm isEditable={isEditable} agent={agent} />
        </SWRConfig>
      </main>
    </div>
  );
}
