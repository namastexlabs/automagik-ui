'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

import { Plus, ShapesIcon } from 'lucide-react';
import { MenuIcon } from '@/components/icons';
import { SidebarHistory } from '@/components/sidebar-history';
import { SidebarUserNav } from '@/components/sidebar-user-nav';
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

export function AppSidebar({
  initialAgents,
}: {
  initialAgents: AgentWithMessagesDTO[];
}) {
  const colorMode = useResolvedTheme();
  const pathname = usePathname();
  const { agent: currentAgent } = useCurrentAgent();
  const { setOpenMobile, open, toggleSidebar, openAgentListDialog } =
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
                  className="p-2 mt-1 h-fit"
                  disabled
                  onClick={() => {
                    toggleSidebar();
                  }}
                >
                  <MenuIcon size={24} />
                </Button>
              </TooltipTrigger>
              <TooltipContent align="end">Toggle sidebar</TooltipContent>
            </Tooltip>
            {open && (
              <Link
                href="/"
                onClick={() => {
                  setOpenMobile(false);
                }}
                className="flex flex-row gap-3 items-center"
              >
                <span className="font-semibold cursor-pointer">
                  <Image
                    src={
                      colorMode === 'dark'
                        ? '/images/automagik-logo-white.svg'
                        : '/images/automagik-logo.svg'
                    }
                    alt="logo"
                    width={220}
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
          className="group/thread-button justify-start gap-2 ml-2 my-4 p-0 hover:bg-transparent h-fit"
        >
          <Link href={currentAgent ? `/chat?agent=${currentAgent.id}` : '/chat'}>
            <div className="rounded-full border-dark-gray border p-[0.35rem] flex items-center justify-center group-hover/thread-button:border-accent-foreground">
              <Plus size={26} />
            </div>
            New thread
          </Link>
        </Button>
        <SidebarHistory initialAgents={initialAgents} />
      </SidebarContent>
      <SidebarFooter className="px-2">
        <Button
          type="button"
          variant="ghost"
          className="group/explore-button flex justify-start gap-2 hover:bg-transparent p-0"
          onClick={() => {
            openAgentListDialog(true);
          }}
        >
          <div className="rounded-full border-dark-gray border p-[0.35rem] flex items-center justify-center group-hover/explore-button:border-accent-foreground">
            <ShapesIcon size={26} />
          </div>
          <p className="text-sm">Explore Agents</p>
        </Button>
        <SidebarUserNav />
      </SidebarFooter>
    </Sidebar>
  );
}
