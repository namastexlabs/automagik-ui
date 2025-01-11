import { memo, type SetStateAction } from 'react';
import { toast } from 'sonner';

import type {
  InternalToolInvocationPayload,
  InternalToolName,
  InternalToolReturn,
} from '@/lib/agents/tool-declarations/client';

import type { UIBlock } from './block';
import { FileIcon, LoaderIcon, MessageIcon, PencilEditIcon } from './icons';

type DocumentToolName =
  | InternalToolName.createDocument
  | InternalToolName.updateDocument
  | InternalToolName.requestSuggestions;

type CreateDocumentInvocation =
  InternalToolInvocationPayload<InternalToolName.createDocument>['args'];

const getActionText = (
  type: 'create' | 'update' | 'request-suggestions',
  tense: 'present' | 'past',
) => {
  switch (type) {
    case 'create':
      return tense === 'present' ? 'Creating' : 'Created';
    case 'update':
      return tense === 'present' ? 'Updating' : 'Updated';
    case 'request-suggestions':
      return tense === 'present'
        ? 'Adding suggestions'
        : 'Added suggestions to';
    default:
      return null;
  }
};

const hasResult = (
  state: InternalToolInvocationPayload['state'],
  result: InternalToolReturn<DocumentToolName> | undefined,
): result is InternalToolReturn<InternalToolName.createDocument> => {
  return state === 'result' && !!result && !Object.hasOwn(result, 'error');
};

type DocumentToolResultProps = {
  args: InternalToolInvocationPayload<DocumentToolName>['args'];
  type: 'create' | 'update' | 'request-suggestions';
  result: InternalToolReturn<DocumentToolName> | undefined;
  state: InternalToolInvocationPayload<DocumentToolName>['state'];
  setBlock: (value: SetStateAction<UIBlock>) => void;
  isReadonly: boolean;
};

function PureDocumentToolResult({
  type,
  state,
  args,
  result,
  setBlock,
  isReadonly,
}: DocumentToolResultProps) {
  if (!hasResult(state, result)) {
    const title =
      args && 'title' in args
        ? (args as CreateDocumentInvocation).title
        : undefined;

    return (
      <DocumentToolCall
        title={title}
        type={type}
        setBlock={setBlock}
        isReadonly={isReadonly}
      />
    );
  }

  return (
    <button
      type="button"
      className="bg-background cursor-pointer border py-2 px-3 rounded-xl w-fit flex flex-row gap-3 items-start"
      onClick={(event) => {
        if (isReadonly) {
          toast.error(
            'Viewing files in shared chats is currently not supported.',
          );
          return;
        }

        const rect = event.currentTarget.getBoundingClientRect();

        const boundingBox = {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        };

        setBlock({
          documentId: result.id,
          kind: result.kind,
          content: '',
          title: result.title,
          isVisible: true,
          status: 'idle',
          boundingBox,
        });
      }}
    >
      <div className="text-muted-foreground mt-1">
        {type === 'create' ? (
          <FileIcon />
        ) : type === 'update' ? (
          <PencilEditIcon />
        ) : type === 'request-suggestions' ? (
          <MessageIcon />
        ) : null}
      </div>
      <div className="text-left">
        {`${getActionText(type, 'past')} "${result.title}"`}
      </div>
    </button>
  );
}

export const DocumentToolResult = memo(PureDocumentToolResult, () => true);

function PureDocumentToolCall({
  type,
  title,
  setBlock,
  isReadonly,
}: Omit<DocumentToolResultProps, 'result' | 'state' | 'args'> & {
  title?: string;
}) {
  return (
    <button
      type="button"
      className="cursor pointer w-fit border py-2 px-3 rounded-xl flex flex-row items-start justify-between gap-3"
      onClick={(event) => {
        if (isReadonly) {
          toast.error(
            'Viewing files in shared chats is currently not supported.',
          );
          return;
        }

        const rect = event.currentTarget.getBoundingClientRect();

        const boundingBox = {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        };

        setBlock((currentBlock) => ({
          ...currentBlock,
          isVisible: true,
          boundingBox,
        }));
      }}
    >
      <div className="flex flex-row gap-3 items-start">
        <div className="text-zinc-500 mt-1">
          {type === 'create' ? (
            <FileIcon />
          ) : type === 'update' ? (
            <PencilEditIcon />
          ) : type === 'request-suggestions' ? (
            <MessageIcon />
          ) : null}
        </div>

        <div className="text-left">
          {`${getActionText(type, 'present')} ${title ? `"${title}"` : ''}`}
        </div>
      </div>

      <div className="animate-spin mt-1">{<LoaderIcon />}</div>
    </button>
  );
}

export const DocumentToolCall = memo(PureDocumentToolCall, () => true);
