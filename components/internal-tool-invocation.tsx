import { type Dispatch, type SetStateAction, useMemo } from 'react';

import type {
  InternalToolInvocationPayload,
  InternalToolName,
  InternalToolReturn,
} from '@/lib/agents/tool-declarations/client';

import { Weather } from './weather';
import { DocumentToolResult } from './document';
import type { UIBlock } from './block';
import { Bookmark } from 'lucide-react';
import { Badge } from './ui/badge';

const getResult = <T extends InternalToolName>(
  toolInvocation: InternalToolInvocationPayload<T>,
): InternalToolReturn<T> | undefined => {
  return toolInvocation.state === 'result'
    ? (toolInvocation.result as InternalToolReturn<T>)
    : undefined;
};

export function ToolInvocation<T extends InternalToolName>({
  setBlock,
  isReadonly,
  toolInvocation,
}: {
  setBlock: Dispatch<SetStateAction<UIBlock>>;
  isReadonly: boolean;
  toolInvocation: InternalToolInvocationPayload<T>;
}) {
  type ToolComponentsMap = {
    [K in InternalToolName]: (
      toolInvocation: InternalToolInvocationPayload<K>,
    ) => JSX.Element;
  };

  const toolComponentsMap: ToolComponentsMap = useMemo(
    () => ({
      getWeather: (toolInvocation) => (
        <Weather
          result={getResult<InternalToolName.getWeather>(toolInvocation)}
        />
      ),
      createDocument: (toolInvocation) => (
        <DocumentToolResult
          type="create"
          setBlock={setBlock}
          isReadonly={isReadonly}
          args={toolInvocation.args}
          state={toolInvocation.state}
          result={getResult<InternalToolName.createDocument>(toolInvocation)}
        />
      ),
      updateDocument: (toolInvocation) => (
        <DocumentToolResult
          type="update"
          setBlock={setBlock}
          isReadonly={isReadonly}
          args={toolInvocation.args}
          state={toolInvocation.state}
          result={getResult<InternalToolName.updateDocument>(toolInvocation)}
        />
      ),
      requestSuggestions: (toolInvocation) => (
        <DocumentToolResult
          type="request-suggestions"
          isReadonly={isReadonly}
          setBlock={setBlock}
          args={toolInvocation.args}
          state={toolInvocation.state}
          result={getResult<InternalToolName.requestSuggestions>(
            toolInvocation,
          )}
        />
      ),
      saveMemories: (toolInvocation) => (
        <div className="flex text-sm leading-relaxed">
          <Bookmark className="mr-1" size={24} />
          <span className="mr-3 font-bold">Updated Memories</span>
          <span className="flex gap-1">
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
    }),
    [setBlock, isReadonly],
  );

  const renderTool = toolComponentsMap[toolInvocation.toolName];
  return renderTool(toolInvocation);
}
