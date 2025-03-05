import { getUser } from '@/lib/auth';
import { getAgentById, getChats } from '@/lib/db/queries';

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

  const agent = await getAgentById({
    id: agentId,
  });

  if (!agent || (agent.userId !== session.user.id && agent.visibility !== 'public')) {
    return Response.json('Agent not found', { status: 404 });
  }

  const chats = await getChats({
    userId: session.user.id,
    agentId,
  });

  return Response.json(chats);
}
