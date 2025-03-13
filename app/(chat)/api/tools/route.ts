import { toHTTPResponse } from '@/lib/data/index.server';
import { getInitialTools } from '@/lib/data/tool';

export async function GET() {
  return toHTTPResponse(await getInitialTools());
}
