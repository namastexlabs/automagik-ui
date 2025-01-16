import { auth } from '@/app/(auth)/auth';
import { mapAgent } from '@/lib/data';
import { getAgentsByUserId } from '@/lib/db/queries';

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const agents = (await getAgentsByUserId({ userId: session.user.id })).map(
    mapAgent,
  );
  return Response.json(agents, { status: 200 });
}
