'use client';
import { ChevronUp, UserRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSWRConfig } from 'swr';

import { createBrowserClient } from '@/lib/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useUser } from '@/contexts/user';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function SidebarUserNav() {
  const { mutate } = useSWRConfig();
  const router = useRouter();
  const { user } = useUser();
  const { state } = useSidebar();

  const handleSignOut = async () => {
    try {
      const supabase = createBrowserClient();
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        return;
      }

      mutate(() => true, undefined, false);
      router.push('/login');
    } catch (error) {
      console.error('Error during sign out:', error);
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton className="data-[state=open]:bg-sidebar-accent rounded-full bg-accent border border-dark-gray data-[state=open]:text-sidebar-accent-foreground h-12">
              <Avatar className="size-8 font-bold">
                <AvatarImage src="" alt="User Avatar" />
                <AvatarFallback>
                  <UserRound />
                </AvatarFallback>
              </Avatar>
              {state === 'expanded' && (
                <>
                  <span className="truncate">{user?.email}</span>
                  <ChevronUp className="ml-auto" />
                </>
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            className="w-[--radix-popper-anchor-width]"
          >
            <DropdownMenuItem asChild>
              <button
                type="button"
                className="w-full cursor-pointer"
                onClick={handleSignOut}
              >
                Sign out
              </button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
