'use server';

import { getUser } from '@/lib/auth';
import { getDocumentSuggestions } from '@/lib/repositories/suggestion';

export async function getSuggestions({ documentId }: { documentId: string }) {
  const session = await getUser();
  if (!session?.user?.id) {
    return [];
  }
  const suggestions = await getDocumentSuggestions(documentId, session.user.id);
  return suggestions ?? [];
}
