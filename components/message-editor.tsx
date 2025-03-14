'use client';

import type { Message } from 'ai';
import {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useRef,
  useState,
} from 'react';

import { deleteTrailingMessagesAction } from '@/app/(chat)/actions';

import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { useChat, useChatHandlers, useChatMessages } from '@/contexts/chat';
import { toast } from 'sonner';

export type MessageEditorProps = {
  message: Message;
  setMode: Dispatch<SetStateAction<'view' | 'edit'>>;
};

export function MessageEditor({ message, setMode }: MessageEditorProps) {
  const { isLoading } = useChat();
  const { messages } = useChatMessages();
  const { setMessages, reload } = useChatHandlers();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [draftContent, setDraftContent] = useState<string>(
    message.parts?.find((part) => part.type === 'text')?.text || '',
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight();
    }
  }, []);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 2}px`;
    }
  };

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraftContent(event.target.value);
    adjustHeight();
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <Textarea
        ref={textareaRef}
        className="bg-transparent outline-none overflow-hidden resize-none !text-base rounded-xl w-full"
        value={draftContent}
        onChange={handleInput}
      />

      <div className="flex flex-row gap-2 justify-end">
        <Button
          variant="outline"
          className="h-fit py-2 px-3"
          onClick={() => {
            setMode('view');
          }}
        >
          Cancel
        </Button>
        <Button
          variant="default"
          className="h-fit py-2 px-3"
          disabled={isSubmitting}
          onClick={async () => {
            if (isLoading) {
              toast.error('Please wait for the model to finish its response!');
              return;
            }

            setIsSubmitting(true);

            const response = await deleteTrailingMessagesAction(message.id);

            if (response.errors) {
              toast.error(
                response.errors?._errors?.[0] ||
                  'Failed to delete trailing messages',
              );
              return;
            }

            const index = messages.findIndex((m) => m.id === message.id);

            if (index !== -1) {
              const parts = message.parts?.map((part) => {
                if (part.type === 'text') {
                  return {
                    type: 'text',
                    text: draftContent,
                  } as const;
                }
                return part;
              });
              const updatedMessage = {
                ...message,
                content: draftContent,
                parts,
              };

              setMessages([...messages.slice(0, index), updatedMessage]);
            }

            setIsSubmitting(false);
            setMode('view');
            reload();
          }}
        >
          {isSubmitting ? 'Sending...' : 'Send'}
        </Button>
      </div>
    </div>
  );
}
