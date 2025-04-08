'use client';

import { useActionState, useEffect, useId, useRef, useState } from 'react';
import { Bot, Heart } from 'lucide-react';
import { toast } from 'sonner';
import { useSWRConfig } from 'swr';
import { useRouter } from 'next/navigation';
import { useProgress } from '@bprogress/next';

import type { AgentDTO, AgentDTOWithSystemPrompt } from '@/lib/data/agent';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { EditableInput } from '@/components/ui/editable-input';
import { EditableTextarea } from '@/components/ui/editable-textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePageUnloadWarning } from '@/hooks/use-page-unload-warning';
import { DataStatus } from '@/lib/data';
import { duplicateAgentAction, saveAgentAction } from '@/app/(chat)/actions';

import { ToolsCombobox } from './tools-combobox';
import { PromptTemplate } from './prompt-template';
import { AgentDeleteDialog } from './agent-delete-dialog';
import { SubmitButton } from './submit-button';
import type { VisibilityType } from './visibility-selector';

export function AgentForm({
  isEditable,
  agent,
}: { isEditable: boolean; agent?: AgentDTOWithSystemPrompt }) {
  usePageUnloadWarning(isEditable);

  const formId = useId();
  const router = useRouter();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const { mutate } = useSWRConfig();
  const { set: setProgress } = useProgress();
  const [template, setTemplate] = useState(agent?.systemPrompt ?? '');
  const [hasHeartbeat, setHasHeartbeat] = useState(agent?.heartbeat ?? false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string>();
  const [visibility, setVisibility] = useState<VisibilityType>(
    agent?.visibility ?? 'private',
  );

  const [{ errors = {} }, formAction] = useActionState<
    Awaited<ReturnType<typeof saveAgentAction>>,
    FormData
  >(
    async (state, formData) => {
      let newState: Awaited<ReturnType<typeof saveAgentAction>>;
      if (agent && !isEditable) {
        newState = await duplicateAgentAction(state, agent.id);
      } else {
        if (avatarFile) {
          formData.append('avatarFile', avatarFile);
        }

        newState = await saveAgentAction(state, formData);
      }

      if (newState.status === DataStatus.Success && newState.data) {
        toast.success(`${agent ? 'Updated' : 'Created'} agent successfully`);
        mutate<AgentDTO[], AgentDTO>('/api/agents', newState.data, {
          populateCache: (data, agents = []) => {
            const hasAgent = agents.some((agent) => agent.id === data.id);
            if (hasAgent) {
              return agents.map((agent) => {
                if (agent.id === data.id) {
                  return data;
                }
                return agent;
              });
            }
            return [...agents, data];
          },
          revalidate: false,
        });
        setProgress(0.4);
        router.push(`/chat?agent=${newState.data.id}`);
      }

      return newState;
    },
    { status: DataStatus.Success, data: null },
  );

  useEffect(() => {
    return () => {
      if (previewImage) {
        URL.revokeObjectURL(previewImage);
      }
    };
  }, [previewImage]);

  const errorMessages = Object.entries(errors).flatMap(([key, value]) => {
    if (key === '_errors') {
      return value;
    }

    return value.map(
      (error) => `${key.charAt(0).toUpperCase() + key.slice(1)}: ${error}`,
    );
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPreviewImage(objectUrl);
    }
  };

  const openFileInput = () => {
    avatarInputRef.current?.click();
  };

  return (
    <form
      action={formAction}
      id={formId}
      className="flex flex-col gap-6 w-full"
    >
      {agent ? <input type="hidden" name="id" value={agent.id} /> : null}
      <h1 className="text-2xl">Profile</h1>
      <div className="flex items-center gap-8">
        <div className="relative mb-auto">
          <Input
            type="file"
            className="hidden"
            accept="image/png, image/jpeg"
            disabled={!isEditable}
            onChange={handleImageChange}
            ref={avatarInputRef}
          />
          <Button
            type="button"
            variant="ghost"
            className="p-0 h-auto hover:bg-transparent"
            onClick={openFileInput}
            disabled={!isEditable}
          >
            <Avatar className="size-40">
              <AvatarImage
                src={previewImage || agent?.avatarUrl || undefined}
                className="object-cover"
              />
              <AvatarFallback className="bg-transparent">
                <Bot className="size-28" />
              </AvatarFallback>
            </Avatar>
          </Button>
        </div>
        <div className="flex flex-col gap-6 min-w-[200px] w-3/5">
          <div className="flex flex-col gap-4 w-full min-w-0">
            <EditableInput
              name="name"
              defaultValue={agent?.name ?? ''}
              isEditable={isEditable}
              initialEditing={!agent}
              placeholder="Enter your agent name here..."
              required
            />
            <EditableTextarea
              id="description"
              name="description"
              placeholder="Describe what this agent does..."
              defaultValue={agent?.description ?? ''}
              isEditable={isEditable}
              rows={4}
              initialEditing={!agent}
            />
          </div>
          <div className="flex gap-6">
            <div className="flex items-center gap-2 bg-muted w-fit p-3 rounded-md">
              <Label
                htmlFor="visibility"
                className="text-md text-foreground font-bold"
              >
                Private agent
              </Label>
              <input type="hidden" name="visibility" value={visibility} />
              <Switch
                id="visibility"
                value={visibility}
                checked={visibility === 'private'}
                disabled={!isEditable}
                className="w-14 h-7"
                thumbClassName="size-5"
                onCheckedChange={() =>
                  setVisibility(visibility === 'private' ? 'public' : 'private')
                }
              />
            </div>
            <div className="flex items-center gap-2 bg-muted w-fit p-3 rounded-md">
              <Label
                htmlFor="heartbeat"
                className="text-md text-foreground font-bold"
              >
                Heartbeat
              </Label>
              {hasHeartbeat ? (
                <input type="hidden" name="heartbeat" value="true" />
              ) : null}
              <Switch
                id="heartbeat"
                checked={hasHeartbeat}
                onCheckedChange={() => setHasHeartbeat(!hasHeartbeat)}
                disabled={!isEditable}
                className="w-14 h-7"
                thumbClassName="size-5 flex items-center justify-center bg-transparent data-[state=checked]:bg-accent-transparent"
                renderThumbContent={() => (
                  <div className="relative">
                    <Heart className="absolute inset-0 hidden text-accent-magenta opacity-50 rounded-full group-data-[state=checked]/thumb:block group-data-[state=checked]/thumb:animate-ping temporary-animation" />
                    <Heart className="size-5 group-data-[state=checked]/thumb:text-accent-magenta temporary-animation transition-colors" />
                  </div>
                )}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="system-prompt" className="text-md">
          Agent Prompt
        </Label>
        <PromptTemplate
          name="systemPrompt"
          dynamicBlocksName="dynamicBlocks"
          placeholder="Enter your agent prompt here..."
          isDisabled={!isEditable}
          template={template}
          onChange={setTemplate}
          initialDynamicBlocks={agent?.dynamicBlocks}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label className="text-md">Tools</Label>
        <ToolsCombobox
          formId={formId}
          initialSelected={agent?.tools.map((tool) => tool.id) || []}
          isDisabled={!isEditable}
        />
      </div>

      {errorMessages.length > 0 && (
        <span className="text-sm text-destructive">
          {errorMessages.join(', ')}
        </span>
      )}
      <div className="flex">
        {agent && isEditable && <AgentDeleteDialog agentId={agent.id} />}
        <SubmitButton className="font-bold ml-auto bg-accent-cyan transition-colors text-accent hover:bg-accent-cyan/80">
          {agent
            ? isEditable
              ? 'SAVE CHANGES'
              : 'DUPLICATE AGENT'
            : 'CREATE AGENT'}
        </SubmitButton>
      </div>
    </form>
  );
}
