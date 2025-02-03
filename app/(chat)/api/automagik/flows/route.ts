import { auth } from '@/app/(auth)/auth';
import { getFlows } from '@/lib/agents/automagik';

export async function GET(request: Request) {
  const session = await auth();

  if (!session || !session.user || !session.user.email) {
    return new Response('Unauthorized', { status: 401 });
  }

  const flows = await getFlows();

  return Response.json(flows, { status: 200 });
}
