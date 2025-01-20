import { auth } from '@/app/(auth)/auth';
import { mapTool } from '@/lib/data';
import { getToolsByUserId } from '@/lib/db/queries';

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const tools = await getToolsByUserId(session.user.id);
  return Response.json(tools.map(mapTool), { status: 200 });
}
