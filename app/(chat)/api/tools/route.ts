import { getUser } from '@/lib/auth';
import { mapTool } from '@/lib/data';
import { getAvailableTools } from '@/lib/db/queries';

export async function GET() {
  const session = await getUser();

  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const tools = (await getAvailableTools(session.user.id)).map(
    (tool) => mapTool(session.user.id, tool),
  );
  return Response.json(tools);
}
