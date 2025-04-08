import { useMemo, type JSX } from 'react';

import type {
  InternalToolInvocationPayload,
  InternalToolName,
  InternalToolReturn,
} from '@/lib/agents/tool-declarations/client';

import { Weather } from './weather';
import { type DocumentToolResultProps, DocumentToolResult } from './document';
import { Bookmark } from 'lucide-react';
import { Badge } from './ui/badge';
import { DocumentPreview } from './document-preview';
import type { BlockKind } from './block';

type BlockToolName =
  | InternalToolName.createDocument
  | InternalToolName.updateDocument
  | InternalToolName.requestSuggestions;

const getResult = <T extends InternalToolName>(
  toolInvocation: InternalToolInvocationPayload<T>,
): InternalToolReturn<T> | undefined => {
  return toolInvocation.state === 'result'
    ? (toolInvocation.result as InternalToolReturn<T>)
    : undefined;
};

export function ToolInvocation<T extends InternalToolName>({
  isReadonly,
  toolInvocation,
}: {
  isReadonly: boolean;
  toolInvocation: InternalToolInvocationPayload<T>;
}) {
  type ToolComponentsMap = {
    [K in InternalToolName]: (
      toolInvocation: InternalToolInvocationPayload<K>,
    ) => JSX.Element;
  };

  const toolComponentsMap: ToolComponentsMap = useMemo(() => {
    const renderBlockToolInvocation = (
      kind: DocumentToolResultProps['type'],
      toolInvocation: InternalToolInvocationPayload<BlockToolName>,
    ) => {
      if (toolInvocation.state !== 'result') {
        return (
          <DocumentPreview
            isReadonly={isReadonly}
            args={toolInvocation.args}
            result={getResult<BlockToolName>(toolInvocation)}
            type={kind}
          />
        );
      }

      if (toolInvocation.result.error) {
        return (
          <div className="flex text-sm leading-relaxed">
            {toolInvocation.result.error}
          </div>
        );
      }

      return (
        <DocumentToolResult
          type={kind}
          isReadonly={isReadonly}
          result={toolInvocation.result as {
            id: string;
            title: string;
            kind: BlockKind;
            error: null;
          }}
        />
      );
    };

    return {
      getWeather: (toolInvocation) => (
        <Weather
          result={getResult<InternalToolName.getWeather>(toolInvocation)}
        />
      ),
      createDocument: (toolInvocation) =>
        renderBlockToolInvocation('create', toolInvocation),
      updateDocument: (toolInvocation) =>
        renderBlockToolInvocation('update', toolInvocation),
      requestSuggestions: (toolInvocation) =>
        renderBlockToolInvocation('request-suggestions', toolInvocation),
      saveMemories: (toolInvocation) => (
        <div className="flex text-sm leading-relaxed max-w-4xl gap-1 flex-wrap">
          <div className="flex items-center mb-1">
            <Bookmark className="mr-1" size={24} />
            <span className="mr-3 font-bold">Updated Memories</span>
          </div>
          <span className="flex gap-1 flex-wrap">
            {getResult<InternalToolName.saveMemories>(
              toolInvocation,
            )?.result.map(({ name }) => (
              <Badge key={name} variant="secondary">
                {name}
              </Badge>
            ))}
          </span>
        </div>
      ),
      listRemoteSources: () => (
        <div className="flex text-lg leading-relaxed max-w-4xl">
          <Badge variant="secondary" className="text-md">
            List RemoteSources Called
          </Badge>
        </div>
      ),
      createRemoteSource: () => (
        <div className="flex text-lg leading-relaxed max-w-4xl">
          <Badge variant="secondary" className="text-md">
            create RemoteSource Called
          </Badge>
        </div>
      ),
      syncWorkflow: () => (
        <div className="flex text-lg leading-relaxed  max-w-4xl">
          <Badge variant="secondary" className="text-md">
            sync Workflow Called
          </Badge>
        </div>
      ),
      listWorkflows: () => (
        <div className="flex leading-relaxed max-w-4xl">
          <Badge variant="secondary" className="text-md">
            list Workflows Called
          </Badge>
        </div>
      ),
      listRemoteWorkflows: () => (
        <div className="flex text-lg leading-relaxed max-w-4xl">
          <Badge variant="secondary" className="text-md">
            List Remote Workflows Called
          </Badge>
        </div>
      ),
      scheduleWorkflow: () => (
        <div className="flex text-lg leading-relaxed max-w-4xl">
          <Badge variant="secondary" className="text-md">
            Schedule Workflow Called
          </Badge>
        </div>
      ),
      listTasks: () => (
        <div className="flex text-lg leading-relaxed max-w-4xl">
          <Badge variant="secondary" className="text-md">
            List Tasks Called
          </Badge>
        </div>
      ),
      listSchedules: () => (
        <div className="flex text-lg leading-relaxed max-w-4xl">
          <Badge variant="secondary" className="text-md">
            List Schedules Called
          </Badge>
        </div>
      ),
      deleteRemoteSource: () => (
        <div className="flex text-lg leading-relaxed max-w-4xl">
          <Badge variant="secondary" className="text-md">
            Delete Remote Source Called
          </Badge>
        </div>
      ),
      deleteSchedule: () => (
        <div className="flex text-lg leading-relaxed max-w-4xl">
          <Badge variant="secondary" className="text-md">
            Delete Schedule Called
          </Badge>
        </div>
      ),
      runWorkflow: () => (
        <div className="flex text-lg leading-relaxed max-w-4xl">
          <Badge variant="secondary" className="text-md">
            Run Workflow Called
          </Badge>
        </div>
      ),
      enableDisableSchedule: () => (
        <div className="flex text-lg leading-relaxed max-w-4xl">
          <Badge variant="secondary" className="text-md">
            Enable/Disable Schedule Called
          </Badge>
        </div>
      ),
    };
  }, [isReadonly]);

  const renderTool = toolComponentsMap[toolInvocation.toolName];
  return renderTool(toolInvocation);
}
