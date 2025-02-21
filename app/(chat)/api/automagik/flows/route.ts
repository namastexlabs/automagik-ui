import { auth } from '@/app/(auth)/auth';
import { getWorkflows } from '@/lib/agents/automagik';

export async function GET(request: Request) {
  const session = await auth();

  if (!session || !session.user || !session.user.email) {
    return new Response('Unauthorized', { status: 401 });
  }

  const workflows = await getWorkflows();

  return Response.json(workflows, { status: 200 });
}
