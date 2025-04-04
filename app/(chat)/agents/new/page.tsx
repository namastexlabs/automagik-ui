import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { AgentForm } from '@/components/agent-form';

export default async function NewAgentPage() {
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
                  Create Agent
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center mx-auto py-6 max-w-[800px] w-[80vw]">
        <AgentForm isEditable />
      </main>
    </div>
  );
}
