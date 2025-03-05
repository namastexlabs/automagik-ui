import { getUser } from '@/lib/auth';
import { getWorkflows } from '@/lib/agents/automagik';

export async function GET(request: Request) {
  const session = await getUser();

  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const workflows = await getWorkflows();
  return Response.json(workflows, { status: 200 });
}
