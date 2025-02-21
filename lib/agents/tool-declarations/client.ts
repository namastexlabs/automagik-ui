/**
 * Tool definitions should be server-side only.
 * This is the client-side only file for tools to get its name and types
 */

import type { Tool } from '@/lib/db/schema';
import type { Source, ToolData } from '../types';
import type { ClientTool } from '@/lib/data';

export type {
  InternalToolReturn,
  InternalToolArgs,
  InternalToolInvocationPayload,
} from '.';

export enum InternalToolName {
  getWeather = 'getWeather',
  createDocument = 'createDocument',
  updateDocument = 'updateDocument',
  requestSuggestions = 'requestSuggestions',
  saveMemories = 'saveMemories',
  syncWorkflow = 'syncWorkflow',
  listWorkflows = 'listWorkflows',
  scheduleWorkflow = 'scheduleWorkflow',
  listTasks = 'listTasks',
  listRemoteWorkflows = 'listRemoteWorkflows',
  createRemoteSource = 'createRemoteSource',
  listSchedules = 'listSchedules',
  listRemoteSources = 'listRemoteSources',
  deleteRemoteSource = 'deleteRemoteSource',
  deleteSchedule = 'deleteSchedule',
  runWorkflow = 'runWorkflow',
  enableDisableSchedule = 'enableDisableSchedule',
}

export const castToolType = <T extends Source, TOOL extends Tool | ClientTool>(
  source: T,
  tool: { source: Source; data: ToolData<Source> },
): tool is TOOL & { source: T; data: ToolData<T> } => {
  return tool.source === source;
};

export const internalToolNames = Object.values(InternalToolName) as string[];
