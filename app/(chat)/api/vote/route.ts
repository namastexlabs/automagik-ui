import { getUser } from '@/lib/auth';
import { ApplicationError } from '@/lib/errors';
import { getChatVotes, updateMessageVote } from '@/lib/repositories/vote';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get('chatId');

  if (!chatId) {
    return new Response('chatId is required', { status: 400 });
  }

  const session = await getUser();

  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const votes = await getChatVotes(chatId, session.user.id);
  return Response.json(votes, { status: 200 });
}

export async function PATCH(request: Request) {
  const {
    chatId,
    messageId,
    type,
  }: { chatId: string; messageId: string; type: 'up' | 'down' } =
    await request.json();

  if (!chatId || !messageId || !type) {
    return new Response('messageId and type are required', { status: 400 });
  }

  const session = await getUser();

  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    await updateMessageVote({
      chatId,
      messageId,
      type: type,
      userId: session.user.id,
    });

    return new Response('Message voted', { status: 200 });
  } catch (error) {
    if (error instanceof ApplicationError) {
      return new Response(error.message, {
        status: error.statusCode,
      });
    }

    console.error('Failed to vote on message:', error);
    return new Response('An unexpected error occurred', {
      status: 500,
    });
  }
}
