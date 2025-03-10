import 'server-only';

import type { BlockKind } from '@/components/block';
import type { Document } from '@/lib/db/schema';
import {
  saveDocument,
  getDocumentsById,
  getDocumentById,
  deleteDocumentsByIdAfterTimestamp,
} from '@/lib/db/queries/document';
import { NotFoundError, UnauthorizedError } from '@/lib/errors';

export async function createDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: BlockKind;
  content: string;
  userId: string;
}): Promise<Document> {
  return await saveDocument({
    id,
    title,
    kind,
    content,
    userId,
  });
}

export async function getDocuments(
  id: string,
  userId: string,
): Promise<Document[]> {
  const documents = await getDocumentsById({ id, userId });
  return documents;
}

export async function getDocument(
  id: string,
  userId: string,
): Promise<Document> {
  const document = await getDocumentById({ id });
  if (!document) {
    throw new NotFoundError('Document not found');
  }
  if (document.userId !== userId) {
    throw new UnauthorizedError('Not authorized to access this document');
  }

  return document;
}

export async function removeDocumentsAfterTimestamp(
  id: string,
  timestamp: Date,
  userId: string,
): Promise<void> {
  const document = await getDocumentById({ id });
  if (!document) {
    throw new NotFoundError('Document not found');
  }
  if (document.userId !== userId) {
    throw new UnauthorizedError('Not authorized to delete this document');
  }

  await deleteDocumentsByIdAfterTimestamp({
    id,
    timestamp,
  });
}
