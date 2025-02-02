import { type Dispatch, type SetStateAction, useMemo } from 'react';

import type {
  InternalToolInvocationPayload,
  InternalToolName,
  InternalToolReturn,
} from '@/lib/agents/tool-declarations/client';

import { Weather } from './weather';
import { DocumentToolResult } from './document';
import type { UIBlock } from './block';

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
  const toolComponentsMap: {
    [K in InternalToolName]: (
      toolInvocation: InternalToolInvocationPayload<K>,
    ) => JSX.Element;
  } = useMemo(
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
    }),
    [setBlock, isReadonly],
  );

  return toolComponentsMap[toolInvocation.toolName](toolInvocation);
};
