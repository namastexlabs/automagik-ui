'use client';

import { Settings, Trash } from 'lucide-react';

import { ModelSelector } from '@/components/model-selector';
import {
  VisibilitySelector,
  type VisibilityType,
} from '@/components/visibility-selector';
import { useChatVisibility } from '@/hooks/use-chat-visibility';
import { useChat, useChatHandlers } from '@/contexts/chat';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useCurrentAgent } from '@/hooks/use-current-agent';
import { toast } from 'sonner';
import { deleteChatAction } from '@/app/(chat)/actions';
import { useSWRConfig } from 'swr';
import { useRouter } from 'next/navigation';
import type { ChatWithLatestMessage } from '@/lib/repositories/chat';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { TokenCount } from './token-count';

export function ChatHeader({
  selectedVisibilityType,
}: { selectedVisibilityType: VisibilityType }) {
  const { agent } = useCurrentAgent();
  const { mutate } = useSWRConfig();
  const router = useRouter();
  const { chat, isReadOnly, modelId, provider } = useChat();
  const { setModelId, setProvider } = useChatHandlers();
  const { visibilityType, setVisibilityType } = useChatVisibility({
    chatId: chat?.id,
    initialVisibility: selectedVisibilityType,
  });

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = async () => {
    const loadingToastId = toast.loading('Deleting chat...');
    setShowDeleteDialog(false);
    const { errors } = await deleteChatAction(chat?.id as string);

    toast.dismiss(loadingToastId);

    if (errors) {
      toast.error(errors?._errors?.[0] || 'Failed to delete chat');
      return;
    }

    toast.success('Chat deleted successfully');

    mutate(
      `/api/history?agentId=${chat?.agentId}`,
      (history: ChatWithLatestMessage[] = []) =>
        history.filter(({ id }) => id !== chat?.id),
    );
    router.push(agent ? `/chat?agent=${agent.id}` : '/chat');
  };

  const completionTokens = chat?.completionTokens ?? 0;
  const promptTokens = chat?.promptTokens ?? 0;

  return (
    <header className="flex sticky top-0 py-3 items-center px-5 gap-2">
      {!isReadOnly && (
        <ModelSelector
          selectedModelId={modelId}
          selectedProvider={provider}
          onChangeModelId={setModelId}
          onChangeProvider={setProvider}
        />
      )}
      <TokenCount chatTokens={completionTokens + promptTokens} />
      {agent && (
        <Button
          asChild
          variant="secondary"
          className="rounded-full h-auto p-3 ml-3"
        >
          <Link href={`/agents/${agent?.id}`}>
            <Settings size={20} />
          </Link>
        </Button>
      )}
      {!isReadOnly && !!chat?.id && (
        <VisibilitySelector
          selectedVisibilityType={visibilityType}
          onChange={setVisibilityType}
        />
      )}
      {!isReadOnly && !!chat?.id && (
        <Button
          className="rounded-full h-auto p-3 bg-transparent hover:bg-accent-magenta/10 text-accent-magenta"
          onClick={() => setShowDeleteDialog(true)}
        >
          <Trash size={20} />
        </Button>
      )}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              chat and remove its data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
}
