import { getChats } from '@/lib/data/chat';
import { toHTTPResponse } from '@/lib/data/index.server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get('agentId');

  if (!agentId) {
    return Response.json('agentId is required!', { status: 400 });
  }

  return toHTTPResponse(await getChats(agentId));
}
