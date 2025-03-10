import { getUser } from '@/lib/auth';
import { mapTool } from '@/lib/data';
import { getUserAvailableTools } from '@/lib/repositories/tool';

export async function GET() {
  const session = await getUser();

  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const tools = (await getUserAvailableTools(session.user.id)).map(
    (tool) => mapTool(session.user.id, tool),
  );
  return Response.json(tools);
}
