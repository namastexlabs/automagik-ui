'use client';

import { useCallback } from 'react';
import { XIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWindowSize } from 'usehooks-ts';
import type { Attachment } from 'ai';

import { cn } from '@/lib/utils';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PlusIcon } from '@/components/icons';
import { AgentListDialog } from '@/components/agent-list-dialog';
import { useSidebar } from '@/components/ui/sidebar';
import { AgentFormDialog } from '@/components/agent-form-dialog';
import { useAgentTabs, useCurrentAgentTab } from '@/contexts/agent-tabs';
import { setTabCookie } from '@/lib/agents/cookies';
import type { AgentDTO } from '@/lib/data/agent';
import { useChatInput } from '@/contexts/chat';

export function AgentTabs({
  agents,
  openAgentListDialog,
  changeAgentListDialog,
  changeAgentDialog,
  agentDialog,
  onSubmit,
}: {
  agents: AgentDTO[];
  changeAgentDialog: (
    isOpen: boolean,
    agentId?: string,
    isSubmitting?: boolean,
  ) => void;
  openAgentListDialog: boolean;
  changeAgentListDialog: (isOpen: boolean) => void;
  agentDialog: {
    agentId: string | null;
    isOpen: boolean;
    isSubmitting: boolean;
  };
  onSubmit: (
    content: string,
    attachments: Attachment[],
    agentId: string,
    agents: AgentDTO[],
    tabs: string[],
  ) => void;
}) {
  const router = useRouter();
  const { open } = useSidebar();
  const { width: windowWidth } = useWindowSize();
  const { tabs, addTab, removeTab } = useAgentTabs();
  const { currentTab, setTab } = useCurrentAgentTab();
  const { input, attachments } = useChatInput();

  const openAgents = agents.filter((agent) => tabs.includes(agent.id));

  const handleOpenAgentDialog = useCallback(
    (open: boolean, agentId?: string) =>
      open ? changeAgentDialog(open, agentId) : changeAgentDialog(false),
    [changeAgentDialog],
  );

  const onSaveAgent = useCallback(
    (agent: AgentDTO) => {
      if (agentDialog.isSubmitting) {
        onSubmit(input, attachments, agent.id, [agent], [agent.id]);
      }

      if (agents.length === 0) {
        setTab(agent.id);
      }
      addTab(agent.id);
    },
    [
      agentDialog.isSubmitting,
      agents.length,
      addTab,
      onSubmit,
      input,
      attachments,
      setTab,
    ],
  );

  const onChangeAgent = (id: string) => {
    setTab(id);
    setTabCookie(id);
    router.push('/');
  };

  const handleRemoveTab = (agentId: string) => {
    const currentIndex = tabs.indexOf(agentId);
    removeTab(agentId);
    if (agentId === currentTab) {
      router.push('/');

      if (tabs.length > 1) {
        setTab(tabs[currentIndex === 0 ? 1 : currentIndex - 1]);
      }
    }
  };

  const selectedStyle = (id: string) =>
    currentTab === id ? 'bg-accent rounded-lg rounded-b-none z-0 h-[34px]' : '';

  return (
    <>
      {(!open || windowWidth < 768) && (
        <Button
          asChild
          variant="outline"
          className="order-2 md:order-1 md:px-2 px-2 md:h-fit ml-auto md:ml-0"
        >
          <Link href="/">New Chat <PlusIcon /></Link>
        </Button>
      )}
      <div className="flex order-4 items-center w-full overflow-x-auto">
        <div className="flex px-3 py-1 gap-1.5 items-center w-1">
          {openAgents.length > 0 &&
            openAgents.map((agent) => (
              <div
                key={agent.id}
                className={cn(
                  `${buttonVariants({ variant: 'ghost' })} group relative flex p-0 shrink-0 w-[220px] h-[30px] z-10 bg-background text-accent-foreground rounded-2xl ${selectedStyle(agent.id)}`,
                )}
              >
                <button
                  type="button"
                  className="flex text-start p-0 text-ellipsis overflow-hidden flex-1 pl-3 h-full items-center"
                  onClick={() => onChangeAgent(agent.id)}
                >
                  {agent.name}
                </button>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      className={`items-center size-5 rounded-full p-0 ml-auto mr-3 hover:bg-destructive ${agent.id === currentTab ? 'inline-flex' : 'hidden group-hover:inline-flex'}`}
                      onClick={() => handleRemoveTab(agent.id)}
                    >
                      <XIcon />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Remove Tab</TooltipContent>
                </Tooltip>
                {agent.id === currentTab && (
                  <>
                    <span className="absolute bg-accent -left-5 w-5 h-full -z-10" />
                    <span className="absolute bg-background -left-5 w-5 h-full rounded-br-[14px]" />
                    <span className="absolute bg-accent -right-5 w-5 h-full -z-10" />
                    <span className="absolute bg-background -right-5 w-5 h-full rounded-bl-[14px]" />
                  </>
                )}
              </div>
            ))}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                type="button"
                className={`relative p-2 h-fit ${openAgents.length === 0 ? '' : 'ml-2'}`}
                onClick={() => {
                  if (agents.length === 0) {
                    changeAgentDialog(true);
                  } else {
                    changeAgentListDialog(true);
                  }
                }}
              >
                {agents.length === 0 && 'New Agent '}
                <PlusIcon />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add a new agent</TooltipContent>
          </Tooltip>
        </div>
        <AgentListDialog
          agents={agents}
          isAgentDialogOpen={agentDialog.isOpen}
          openAgentDialog={(agentId) => changeAgentDialog(true, agentId)}
          openAgentListDialog={changeAgentListDialog}
          isOpenAgentListDialog={openAgentListDialog}
        />
        <AgentFormDialog
          agent={agents.find((agent) => agent.id === agentDialog.agentId)}
          onSuccess={onSaveAgent}
          isOpen={agentDialog.isOpen}
          setOpen={handleOpenAgentDialog}
        />
      </div>
    </>
  );
}
