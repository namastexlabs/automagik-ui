import 'server-only';

import type { Suggestion } from '@/lib/db/schema';
import {
  saveSuggestions,
  getSuggestionsByDocumentId,
} from '@/lib/db/queries/suggestion';
import { UnauthorizedError } from '../errors';

export async function createSuggestions(
  suggestions: Suggestion[],
): Promise<void> {
  await saveSuggestions({ suggestions });
}

export async function getDocumentSuggestions(
  documentId: string,
  userId: string,
): Promise<Suggestion[]> {
  if (!userId) {
    throw new UnauthorizedError('User not found');
  }

  return await getSuggestionsByDocumentId({ documentId });
}
