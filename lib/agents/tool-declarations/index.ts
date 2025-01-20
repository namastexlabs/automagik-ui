import 'server-only';
import type { z } from 'zod';

import type { ToolDefinition, ToolInvocation } from '../types';
import { createDocumentTool } from './create-document';
import { updateDocumentTool } from './update-document';
import { weatherTool } from './get-weather';
import { requestSuggestionsTool } from './request-suggestions';
import { saveMemoriesTool } from './save-memories';
import type { InternalToolName } from './client';

export const INTERNAL_TOOL_MAP = {
  [weatherTool.name]: weatherTool,
  [createDocumentTool.name]: createDocumentTool,
  [updateDocumentTool.name]: updateDocumentTool,
  [requestSuggestionsTool.name]: requestSuggestionsTool,
  [saveMemoriesTool.name]: saveMemoriesTool,
} as const;

export type InternalToolOptions = typeof INTERNAL_TOOL_MAP;
export type InternalToolReturn<K extends InternalToolName> =
  InternalToolOptions[K] extends ToolDefinition<K, infer R, any> ? R : never;

export type InternalToolArgs<K extends InternalToolName> =
  InternalToolOptions[K] extends ToolDefinition<K, any, infer ARGS>
    ? z.infer<ARGS>
    : never;

export type InternalToolInvocationPayload<
  K extends InternalToolName = InternalToolName,
> = ToolInvocation<K, InternalToolOptions[K]>;
