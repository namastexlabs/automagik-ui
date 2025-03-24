'use client';

import type { Message } from 'ai';
import cx from 'classnames';
import type React from 'react';
import {
  useRef,
  useEffect,
  useState,
  useCallback,
  type ChangeEvent,
  memo,
  useMemo,
} from 'react';
import { toast } from 'sonner';
import { useWindowSize } from 'usehooks-ts';

import {
  useChat,
  useChatHandlers,
  useChatInput,
  useChatMessages,
} from '@/contexts/chat';
import { useAgentTabs, useCurrentAgentTab } from '@/contexts/agent-tabs';
import { throttle } from '@/lib/utils';
import { getModelData, isExtendedThinkingAllowed } from '@/lib/ai/models';

import { ArrowUpIcon, PaperclipIcon, StopIcon } from './icons';
import { PreviewAttachment } from './preview-attachment';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { ModelParameters } from './model-parameters';
import { Switch } from './ui/switch';

export function MultimodalInput({
  className,
}: {
  className?: string;
}) {
  const { width, height } = useWindowSize({ initializeWithValue: false });
  const {
    chat,
    isLoading,
    isImageAllowed,
    modelId,
    provider,
    isExtendedThinking,
    isSubmitting,
  } = useChat();
  const {
    input,
    attachments,
    temperature,
    topP,
    presencePenalty,
    frequencyPenalty,
  } = useChatInput();
  const {
    setMessages,
    handleSubmit,
    setInput,
    setAttachments,
    stop,
    toggleExtendedThinking,
  } = useChatHandlers();
  const { tabs } = useAgentTabs();
  const { currentTab } = useCurrentAgentTab();

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback((height?: number) => {
    if (textareaRef.current) {
      const MAX_HEIGHT = (height || 0) * 0.33;
      const isMaxHeight =
        height && textareaRef.current.scrollHeight > MAX_HEIGHT;

      if (isMaxHeight) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${MAX_HEIGHT}px`;
      } else {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 2}px`;
      }
    }
  }, []);

  const throttledAdjustHeight = useMemo(
    () => throttle(adjustHeight, 50),
    [adjustHeight],
  );

  useEffect(() => {
    if (textareaRef.current) {
      throttledAdjustHeight(height);
    }
  }, [throttledAdjustHeight, height]);

  const resetHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = '56px';
    }
  };

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
    throttledAdjustHeight(height);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadQueue, setUploadQueue] = useState<Array<string>>([]);

  const submitForm = useCallback(() => {
    handleSubmit(input, attachments, currentTab as string, tabs, {
      temperature,
      topP,
      presencePenalty,
      frequencyPenalty,
    });
    resetHeight();

    if (width && width > 768) {
      textareaRef.current?.focus();
    }
  }, [
    input,
    handleSubmit,
    attachments,
    currentTab,
    tabs,
    width,
    temperature,
    topP,
    presencePenalty,
    frequencyPenalty,
  ]);

  const uploadFile = async (file: File, chatId?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.set('chatId', chatId || '');

    try {
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        return data;
      }

      toast.error(data.error);
    } catch (error) {
      toast.error('Failed to upload file, please try again!');
    }
  };

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);

      setUploadQueue(files.map((file) => file.name));

      try {
        const uploadPromises = files.map((file) => uploadFile(file, chat?.id));
        const uploadedAttachments = await Promise.all(uploadPromises);
        const successfullyUploadedAttachments = uploadedAttachments.filter(
          (attachment) => attachment !== undefined,
        );

        setAttachments([...attachments, ...successfullyUploadedAttachments]);
      } catch (error) {
        console.error('Error uploading files!', error);
      } finally {
        setUploadQueue([]);
      }
    },
    [setAttachments, attachments, chat?.id],
  );

  return (
    <div className="relative w-full flex flex-col gap-4">
      <input
        type="file"
        className="fixed -top-4 -left-4 size-0.5 opacity-0 pointer-events-none"
        ref={fileInputRef}
        multiple
        accept=".jpeg, .png"
        onChange={handleFileChange}
        tabIndex={-1}
      />

      {(attachments.length > 0 || uploadQueue.length > 0) && (
        <div className="flex flex-row gap-2 overflow-x-auto items-end">
          {attachments.map((attachment) => (
            <PreviewAttachment key={attachment.url} attachment={attachment} />
          ))}

          {uploadQueue.map((filename) => (
            <PreviewAttachment
              key={filename}
              attachment={{
                url: '',
                name: filename,
                contentType: '',
              }}
              isUploading={true}
            />
          ))}
        </div>
      )}

      <div className="relative w-full flex flex-col rounded-2xl gap-4 bg-accent border max-h-[calc(33dvh)] has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-background has-[:focus-visible]:ring-2">
        <Textarea
          ref={textareaRef}
          placeholder="Send a message..."
          value={input}
          onChange={handleInput}
          className={cx(
            'resize-none mb-12 px-4 mt-3 pt-0 min-h-[56px] !text-base outline-none bg-transparent border-none focus-visible:!ring-offset-transparent focus-visible:!ring-transparent',
            className,
          )}
          rows={1}
          autoFocus
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();

              if (isLoading) {
                toast.error(
                  'Please wait for the model to finish its response!',
                );
              } else {
                submitForm();
              }
            }
          }}
        />

        <div className="absolute w-full bottom-0 p-2 pl-4 pb-1 gap-1.5 flex flex-row justify-start items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <AttachmentsButton
                fileInputRef={fileInputRef}
                disabled={isLoading || !isImageAllowed}
              />
            </TooltipTrigger>
            <TooltipContent>
              {isImageAllowed
                ? 'Attach a file'
                : 'Files are not allowed for this model'}
            </TooltipContent>
          </Tooltip>
          <ModelParameters />
          {isExtendedThinkingAllowed(getModelData(provider, modelId)) && (
            <div className="flex flex-row gap-2 items-center bg-secondary rounded-md ml-3.5 p-2">
              <p className="text-sm">Reasoning</p>
              <Switch
                checked={isExtendedThinking}
                onCheckedChange={toggleExtendedThinking}
              />
            </div>
          )}
          <div className="ml-auto">
            {isLoading ? (
              <StopButton stop={stop} setMessages={setMessages} />
            ) : (
              <SendButton
                input={input}
                submitForm={submitForm}
                uploadQueue={uploadQueue}
                isSubmitting={isSubmitting}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PureAttachmentsButton({
  disabled,
  fileInputRef,
}: {
  disabled?: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <Button
      disabled={disabled}
      className="rounded-full p-2 size-8 bg-secondary"
      onClick={(event) => {
        event.preventDefault();
        fileInputRef.current?.click();
      }}
      variant="ghost"
    >
      <PaperclipIcon size={18} />
    </Button>
  );
}

const AttachmentsButton = memo(PureAttachmentsButton);

function PureStopButton({
  stop,
  setMessages,
}: {
  stop: () => void;
  setMessages: (messages: Message[]) => void;
}) {
  const { messages } = useChatMessages();

  return (
    <Button
      className="rounded-full p-1.5 h-fit border dark:border-zinc-600"
      onClick={(event) => {
        event.preventDefault();
        stop();
        setMessages(messages);
      }}
    >
      <StopIcon size={14} />
    </Button>
  );
}

const StopButton = memo(PureStopButton);

function SendButton({
  submitForm,
  input,
  uploadQueue,
  isSubmitting,
}: {
  submitForm: () => void;
  input: string;
  uploadQueue: Array<string>;
  isSubmitting: boolean;
}) {
  return (
    <Button
      className="h-fit"
      onClick={(event) => {
        event.preventDefault();
        if (isSubmitting) {
          return;
        }

        submitForm();
      }}
      disabled={input.trim() === '' || uploadQueue.length > 0 || isSubmitting}
    >
      <ArrowUpIcon size={20} />
    </Button>
  );
}
