import 'server-only';
import { eq, asc, and, gt } from 'drizzle-orm';

import type { BlockKind } from '@/components/block';

import { db, schema } from './index';

export async function saveDocument({
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
}) {
  try {
    const [createdDocument] = await db
      .insert(schema.document)
      .values({
        id,
        title,
        kind,
        content,
        userId,
        createdAt: new Date(),
      })
      .returning();

    return createdDocument;
  } catch (error) {
    console.error('Failed to save document in database');
    throw error;
  }
}

export async function getDocumentsById({
  id,
  userId,
}: { id: string; userId: string }) {
  try {
    const documents = await db
      .select()
      .from(schema.document)
      .where(
        and(eq(schema.document.id, id), eq(schema.document.userId, userId)),
      )
      .orderBy(asc(schema.document.createdAt));

    return documents;
  } catch (error) {
    console.error('Failed to get document by id from database');
    throw error;
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const selectedDocument = await db.query.document.findFirst({
      where: (document, { eq }) => eq(document.id, id),
      orderBy: (document, { desc }) => [desc(document.createdAt)],
    });

    return selectedDocument;
  } catch (error) {
    console.error('Failed to get document by id from database');
    throw error;
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    await db
      .delete(schema.suggestion)
      .where(
        and(
          eq(schema.suggestion.documentId, id),
          gt(schema.suggestion.documentCreatedAt, timestamp),
        ),
      );

    return await db
      .delete(schema.document)
      .where(
        and(
          eq(schema.document.id, id),
          gt(schema.document.createdAt, timestamp),
        ),
      );
  } catch (error) {
    console.error(
      'Failed to delete documents by id after timestamp from database',
    );
    throw error;
  }
}
