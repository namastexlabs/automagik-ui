'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Plus, ShapesIcon } from 'lucide-react';

import { MenuIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useResolvedTheme } from '@/hooks/use-resolved-theme';
import type { AgentWithMessagesDTO } from '@/lib/data/agent';
import { useCurrentAgent } from '@/hooks/use-current-agent';
import { cn } from '@/lib/utils';

import { SidebarHistory } from './sidebar-history';
import { SidebarUserNav } from './sidebar-user-nav';
import { AgentListDialog } from './agent-list-dialog';

export function AppSidebar({
  initialAgents,
}: {
  initialAgents: AgentWithMessagesDTO[];
}) {
  const colorMode = useResolvedTheme();
  const { agent: currentAgent } = useCurrentAgent();
  const { setOpenMobile, toggleSidebar, openAgentListDialog, state } =
    useSidebar();

  return (
    <Sidebar className="group-data-[side=left]:border-r-0">
      <SidebarHeader className="px-2">
        <SidebarMenu>
          <div className="flex flex-row items-center mt-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  type="button"
                  className={cn(
                    'p-2 mt-1 h-fit rounded-full hover:bg-transparent',
                    {
                      'p-0 mb-3 mx-auto': state === 'collapsed',
                    },
                  )}
                  onClick={toggleSidebar}
                >
                  <MenuIcon size={20} />
                </Button>
              </TooltipTrigger>
              <TooltipContent align="end">Toggle sidebar</TooltipContent>
            </Tooltip>
            {state === 'expanded' && (
              <Link
                href="/"
                onClick={() => {
                  setOpenMobile(false);
                }}
                className="flex flex-row gap-3 items-center ml-3"
              >
                <span className="font-semibold cursor-pointer">
                  <Image
                    src={
                      colorMode === 'dark'
                        ? '/images/automagik-logo-white.svg'
                        : '/images/automagik-logo.svg'
                    }
                    alt="logo"
                    width={180}
                    height={30}
                    className="aspect-[12/2] object-cover"
                  />
                </span>
              </Link>
            )}
          </div>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <Button
          asChild
          variant="ghost"
          type="button"
          className={cn(
            'group/thread-button justify-start gap-2 ml-2 my-4 p-0 hover:bg-transparent h-fit',
            {
              '!bg-transparent justify-center m-0 mb-5': state === 'collapsed',
            },
          )}
        >
          <Link
            href={currentAgent ? `/chat?agent=${currentAgent.id}` : '/chat'}
          >
            <div className="rounded-full border-dark-gray border p-[0.35rem] flex items-center justify-center group-hover/thread-button:border-accent-foreground">
              <Plus size={26} />
            </div>
            {state === 'expanded' && 'New thread'}
          </Link>
        </Button>
        <SidebarHistory initialAgents={initialAgents} />
      </SidebarContent>
      <SidebarFooter className="px-2">
        <Button
          type="button"
          variant="ghost"
          className={cn(
            'group/explore-button flex justify-start gap-2 hover:bg-transparent p-0',
            {
              '!bg-transparent justify-center': state === 'collapsed',
            },
          )}
          onClick={() => {
            openAgentListDialog(true);
          }}
        >
          <div className="rounded-full border-dark-gray border p-[0.35rem] flex items-center justify-center group-hover/explore-button:border-accent-foreground">
            <ShapesIcon size={26} />
          </div>
          {state === 'expanded' && <p className="text-sm">Explore Agents</p>}
        </Button>
        <SidebarUserNav />
      </SidebarFooter>
      <AgentListDialog />
    </Sidebar>
  );
}
