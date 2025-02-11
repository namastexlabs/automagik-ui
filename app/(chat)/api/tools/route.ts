import { auth } from '@/app/(auth)/auth';
import { mapTool } from '@/lib/data';
import { getAvailableTools } from '@/lib/db/queries';

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const tools = await getAvailableTools(session.user.id);
  return Response.json(
    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    tools.map((tool) => mapTool(session.user!.id!, tool), {
      status: 200,
    }),
  );
}
