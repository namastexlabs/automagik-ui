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

export default async function AgentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getUser();

  if (!z.string().uuid().safeParse(id).success) {
    notFound();
  }

  const { data: agent, errors } = await getAgentWithSystemPrompt(id);

  if (errors || !agent) {
    throw new Error(JSON.stringify(errors));
  }

  const isEditable = session.user.id === agent.userId;

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
        <AgentForm isEditable={isEditable} agent={agent} />
      </main>
    </div>
  );
}
