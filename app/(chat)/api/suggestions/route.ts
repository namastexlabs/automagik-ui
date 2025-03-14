import { getUser } from '@/lib/auth';
import { getErrorStatusCode } from '@/lib/data/index.server';
import { ApplicationError } from '@/lib/errors';
import { getDocumentSuggestions } from '@/lib/repositories/suggestion';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const documentId = searchParams.get('documentId');

  if (!documentId) {
    return new Response('Not Found', { status: 404 });
  }

  const session = await getUser();

  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const suggestions = await getDocumentSuggestions(documentId, session.user.id);

  const [suggestion] = suggestions;

  if (!suggestion) {
    return Response.json([], { status: 200 });
  }

  if (suggestion.userId !== session.user.id) {
    return new Response('Unauthorized', { status: 401 });
  }

    return Response.json(suggestions, { status: 200 });
  } catch (error) {
    if (error instanceof ApplicationError) {
      return new Response(error.message, {
        status: getErrorStatusCode(error.status),
      });
    }

    console.error('Failed to get document suggestions:', error);
    return new Response('An unexpected error occurred', {
      status: 500,
    });
  }
}