import 'server-only';

import type { InferParameters, ToolDefinition, ToolInvocation } from '../types';
import { createDocumentTool } from './create-document';
import { updateDocumentTool } from './update-document';
import { weatherTool } from './get-weather';
import { requestSuggestionsTool } from './request-suggestions';
import { saveMemoriesTool } from './save-memories';
import type { InternalToolName } from './client';
import { syncFlowTool } from './sync-flow';
import { listLangflowFlowsTool } from './list-langflow-flows';
import { listFlowsTool } from './list-flows';

export const INTERNAL_TOOL_MAP = {
  [weatherTool.name]: weatherTool,
  [createDocumentTool.name]: createDocumentTool,
  [updateDocumentTool.name]: updateDocumentTool,
  [requestSuggestionsTool.name]: requestSuggestionsTool,
  [saveMemoriesTool.name]: saveMemoriesTool,
  [syncFlowTool.name]: syncFlowTool,
  [listLangflowFlowsTool.name]: listLangflowFlowsTool,
  [listFlowsTool.name]: listFlowsTool,
} as const;

export type InternalToolOptions = typeof INTERNAL_TOOL_MAP;
export type InternalToolReturn<K extends InternalToolName> =
  InternalToolOptions[K] extends ToolDefinition<K, infer R, any> ? R : never;

export type InternalToolArgs<K extends InternalToolName> =
  InternalToolOptions[K] extends ToolDefinition<K, any, infer ARGS>
    ? InferParameters<ARGS>
    : never;

export type InternalToolInvocationPayload<
  K extends InternalToolName = InternalToolName,
> = ToolInvocation<K, InternalToolOptions[K]>;
