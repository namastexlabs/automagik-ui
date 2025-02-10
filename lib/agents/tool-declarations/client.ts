/**
 * Tool definitions should be server-side only.
 * This is the client-side only file for tools to get its name and types
 */

import type { Tool } from '@/lib/db/schema';
import type { Source, ToolData } from '../types';

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
  syncFlow = 'syncFlow',
  listFlows = 'listFlows',
  listLangflowFlows = 'listLangflowFlows',
  scheduleFlow = 'scheduleFlow',
  listTasks = 'listTasks',
}

export const castToolType = <T extends Source>(
  source: T,
  tool: { source: Source; data: ToolData<Source> },
): tool is Tool & { source: T; data: ToolData<T> } => {
  return tool.source === source;
};

export const internalToolNames = Object.values(InternalToolName) as string[];
