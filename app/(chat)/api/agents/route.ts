import { toHTTPResponse } from '@/lib/data/index.server';
import { getInitialAgents } from '@/lib/data/agent';

export async function GET(request: Request) {
  return toHTTPResponse(await getInitialAgents());
}
