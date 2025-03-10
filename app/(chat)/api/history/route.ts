import { getUser } from '@/lib/auth';
import { getAgentChats } from '@/lib/repositories/chat';
import { ApplicationError } from '@/lib/errors';
export async function GET(request: Request) {
  const session = await getUser();
  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get('agentId');

  if (!session?.user?.id) {
    return Response.json('Unauthorized!', { status: 401 });
  }

  if (!agentId) {
    return Response.json('agentId is required!', { status: 400 });
  }

  try {
    const chats = await getAgentChats(session.user.id, agentId);

    return Response.json(chats);
  } catch (error) {
    if (error instanceof ApplicationError) {
      return Response.json(error.message, { status: error.statusCode });
    }

    console.error('Failed to get agent chats:', error);
    return Response.json('An unexpected error occurred', { status: 500 });
  }
}
