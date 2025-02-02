import { auth } from '@/app/(auth)/auth';
import { getAgentsByUserId } from '@/lib/db/queries';

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const agents = await getAgentsByUserId({ userId: session.user.id });
  return Response.json(agents, { status: 200 });
}
