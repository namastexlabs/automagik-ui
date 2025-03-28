'use client';
import { ChevronUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';

import { createBrowserClient } from '@/lib/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useUser } from '@/contexts/user';
import { useResolvedTheme } from '@/hooks/use-resolved-theme';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function SidebarUserNav() {
  const { setTheme } = useTheme();
  const colorMode = useResolvedTheme();
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
                <AvatarFallback className="bg-red-500">
                  {user?.email?.slice(0, 2).toUpperCase()}
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
            <DropdownMenuItem
              className="cursor-pointer"
              onSelect={() => setTheme(colorMode === 'dark' ? 'light' : 'dark')}
            >
              {`Toggle ${colorMode === 'light' ? 'dark' : 'light'} mode`}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
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
