import { getUser } from '@/lib/auth';
import { mapAgent } from '@/lib/data';
import { getUserAgents } from '@/lib/repositories/agent';

export async function GET(request: Request) {
  const session = await getUser();

  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const agents = (await getUserAgents(session.user.id)).map((agent) =>
    mapAgent(session.user.id, agent),
  );
  return Response.json(agents, { status: 200 });
}
