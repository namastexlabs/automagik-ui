'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import useSWR from 'swr';
import { Search } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn, fetcher } from '@/lib/utils';
import { deleteChatAction } from '@/app/(chat)/actions';
import { SidebarAgentItem } from '@/components/sidebar-agent-item';
import type { AgentWithMessagesDTO } from '@/lib/data/agent';
import { Input } from '@/components/ui/input';
import { Accordion } from './ui/accordion';

export function SidebarHistory({
  initialAgents,
}: {
  initialAgents: AgentWithMessagesDTO[];
}) {
  const { id } = useParams();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const router = useRouter();
  const { state } = useSidebar();

  const [openHistories, setOpenHistories] = useState<string[]>([]);

  const { data: agents, mutate } = useSWR<AgentWithMessagesDTO[]>(
    `/agents`,
    fetcher,
    {
      fallbackData: initialAgents,
      revalidateOnMount: false,
      revalidateOnFocus: false,
    },
  );

  const handleDelete = async () => {
    const loadingToastId = toast.loading('Deleting chat...');
    setShowDeleteDialog(false);
    const { errors } = await deleteChatAction(deleteId as string);

    toast.dismiss(loadingToastId);

    if (errors) {
      toast.error(errors?._errors?.[0] || 'Failed to delete chat');
      return;
    }

    toast.success('Chat deleted successfully');

    mutate((history = []) => history.filter((chat) => chat.id !== deleteId));
    if (deleteId === id) {
      router.push('/chat');
    }
  };

  const onDeleteThread = (threadId: string) => {
    setDeleteId(threadId);
    setShowDeleteDialog(true);
  };

  return (
    <>
      <SidebarGroup className="p-0">
        <SidebarGroupContent>
          <SidebarMenu
            className={cn('px-2', { 'px-0 gap-4': state === 'collapsed' })}
          >
            {state === 'expanded' && (
              <>
                <h2 className="text-sm font-medium mb-2">Recent Threads</h2>
                <div className="relative mb-4">
                  <Input
                    type="text"
                    placeholder="Search for agents"
                    className="pl-8"
                  />
                  <Search
                    size={16}
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                </div>
              </>
            )}
            <Accordion
              type="multiple"
              value={openHistories}
              onValueChange={setOpenHistories}
              className="space-y-2"
            >
              {agents?.map((agent) => (
                <SidebarAgentItem
                  key={agent.id}
                  agent={agent}
                  isOpen={openHistories.includes(agent.id)}
                  onDelete={onDeleteThread}
                />
              ))}
            </Accordion>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              chat and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
