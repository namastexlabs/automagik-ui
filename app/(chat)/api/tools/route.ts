import { auth } from '@/app/(auth)/auth';
import { getInternalTools } from '@/lib/db/queries';

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const tools = await getInternalTools();
  return Response.json(tools, { status: 200 });
}
