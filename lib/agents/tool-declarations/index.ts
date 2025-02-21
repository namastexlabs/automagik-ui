import 'server-only';

import type { InferParameters, ToolDefinition, ToolInvocation } from '../types';
import { createDocumentTool } from './create-document';
import { updateDocumentTool } from './update-document';
import { weatherTool } from './get-weather';
import { requestSuggestionsTool } from './request-suggestions';
import { saveMemoriesTool } from './save-memories';
import type { InternalToolName } from './client';
import { syncWorkflowTool } from './sync-workflow';
import { listRemoteWorkflowsTool } from './list-remote-workflows';
import { listWorkflowsTool } from './list-workflows';
import { scheduleWorkflowTool } from './schedule-workflow';
import { listTasksTool } from './list-tasks';
import { listRemoteSourcesTool } from './list-remote-sources';
import { createRemoteSourceTool } from './create-remote-source';
import { deleteRemoteSourceTool } from './delete-remote-source';
import { deleteScheduleTool } from './delete-schedule';
import { runWorkflowTool } from './run-workflow';
import { enableDisableScheduleTool } from './enable-disable-schedule';
import { listSchedulesTool } from './list-schedules';

export const INTERNAL_TOOL_MAP = {
  [weatherTool.name]: weatherTool,
  [createDocumentTool.name]: createDocumentTool,
  [updateDocumentTool.name]: updateDocumentTool,
  [requestSuggestionsTool.name]: requestSuggestionsTool,
  [saveMemoriesTool.name]: saveMemoriesTool,
  [syncWorkflowTool.name]: syncWorkflowTool,
  [scheduleWorkflowTool.name]: scheduleWorkflowTool,
  [createRemoteSourceTool.name]: createRemoteSourceTool,
  [runWorkflowTool.name]: runWorkflowTool,
  [enableDisableScheduleTool.name]: enableDisableScheduleTool,
  [listRemoteWorkflowsTool.name]: listRemoteWorkflowsTool,
  [listWorkflowsTool.name]: listWorkflowsTool,
  [listTasksTool.name]: listTasksTool,
  [listSchedulesTool.name]: listSchedulesTool,
  [listRemoteSourcesTool.name]: listRemoteSourcesTool,
  [deleteRemoteSourceTool.name]: deleteRemoteSourceTool,
  [deleteScheduleTool.name]: deleteScheduleTool,
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
