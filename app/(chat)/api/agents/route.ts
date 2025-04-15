import type { NextRequest } from 'next/server';
import { toHTTPResponse } from '@/lib/data/index.server';
import { getAgents } from '@/lib/data/agent';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = Number.parseInt(searchParams.get('page') || '1');
  const limit = Number.parseInt(searchParams.get('limit') || '10');

    return toHTTPResponse(await getAgents(page, limit));
}
