/**
 * Tool definitions should be server-side only.
 * This is the client-side only file for tools to get its name and types
 */

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
}

export const internalToolNames = Object.values(InternalToolName) as string[];
