import { getUser } from '@/lib/auth';
import { getWorkflows } from '@/lib/services/automagik';

export async function GET(request: Request) {
  const session = await getUser();

  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const workflows = await getWorkflows(request.signal);
  return Response.json(workflows, { status: 200 });
}
