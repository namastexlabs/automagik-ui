import { useMemo } from 'react';

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
import type { DocumentExecuteReturn } from '@/lib/agents/types';

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

const isErrorBlock = (
  result: DocumentExecuteReturn,
): result is { error: string } => Object.hasOwn(result, 'error');

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
      const result = getResult<BlockToolName>(toolInvocation);

      if (!result) {
        return (
          <DocumentPreview
            isReadonly={isReadonly}
            args={toolInvocation.args}
            result={getResult<BlockToolName>(toolInvocation)}
          />
        );
      }
      if (isErrorBlock(result)) {
        return (
          <div className="flex text-sm leading-relaxed">{result.error}</div>
        );
      }

      return (
        <DocumentToolResult
          type={kind}
          isReadonly={isReadonly}
          result={result}
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
        <div className="flex text-sm leading-relaxed max-w-3xl gap-1 flex-wrap">
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
      syncFlow: () => (
        <div className="flex text-lg leading-relaxed  max-w-3xl">
          <Badge variant="secondary" className="text-md">syncFlow Called</Badge>
        </div>
      ),
      listFlows: () => (
        <div className="flex leading-relaxed max-w-3xl">
          <Badge variant="secondary" className="text-md">listFlows Called</Badge>
        </div>
      ),
      listLangflowFlows: () => (
        <div className="flex text-lg leading-relaxed max-w-3xl">
          <Badge variant="secondary" className="text-md">listLangflowFlows Called</Badge>
        </div>
      ),
      scheduleFlow: () => (
        <div className="flex text-lg leading-relaxed max-w-3xl">
          <Badge variant="secondary" className="text-md">scheduleFlow Called</Badge>
        </div>
      ),
      listTasks: () => (
        <div className="flex text-lg leading-relaxed max-w-3xl">
          <Badge variant="secondary" className="text-md">listTasks Called</Badge>
        </div>
      ),
    };
  }, [isReadonly]);

  const renderTool = toolComponentsMap[toolInvocation.toolName];
  return renderTool(toolInvocation);
}
