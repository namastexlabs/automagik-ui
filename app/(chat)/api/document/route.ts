import { getUser } from '@/lib/auth';
import { ApplicationError } from '@/lib/errors';
import {
  createDocument,
  getDocuments,
  removeDocumentsAfterTimestamp,
} from '@/lib/repositories/document';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return Response.json({ error: 'Missing id' }, { status: 400 });
    }

    const session = await getUser();
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const documents = await getDocuments(id, session.user.id);
    return Response.json(documents);
  } catch (error) {
    if (error instanceof ApplicationError) {
      return new Response(error.message, {
        status: error.statusCode,
      });
    }

    console.error('Failed to get documents:', error);
    return new Response('An unexpected error occurred', {
      status: 500,
    });
  }
}

export async function DELETE(request: Request) {
  const session = await getUser();
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const timestamp = searchParams.get('timestamp');

  if (!id || !timestamp) {
    return Response.json({ error: 'Missing id or timestamp' }, { status: 400 });
  }

  await removeDocumentsAfterTimestamp(id, new Date(timestamp), session.user.id);
  return Response.json({ status: 'ok' });
}

export async function POST(request: Request) {
  const session = await getUser();
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return Response.json({ error: 'Missing id' }, { status: 400 });
  }

  const { content, title, kind } = await request.json();

  try {
    const document = await createDocument({
      id,
      content,
      title,
      kind,
      userId: session.user.id,
    });

    return Response.json(document);
  } catch (error) {
    if (error instanceof ApplicationError) {
      return new Response(error.message, {
        status: error.statusCode,
      });
    }

    console.error('Failed to create document:', error);
    return new Response('An unexpected error occurred', {
      status: 500,
    });
  }
}
