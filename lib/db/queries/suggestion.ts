import 'server-only';

import { db, schema } from './index';

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Array<schema.Suggestion>;
}) {
  try {
    return await db.insert(schema.suggestion).values(suggestions);
  } catch (error) {
    console.error('Failed to save suggestions in database');
    throw error;
  }
}

export async function getSuggestionsByDocumentId({
  documentId, 
}: {
  documentId: string;
}) {
  try {
    return await db.query.suggestion.findMany({
      where: (suggestion, { eq }) => eq(suggestion.documentId, documentId),
    });
  } catch (error) {
    console.error(
      'Failed to get suggestions by document version from database',
    );
    throw error;
  }
} 