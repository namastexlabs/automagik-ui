import { toHTTPResponse } from '@/lib/data/index.server';
import { getMessageVotes, updateMessageVote } from '@/lib/data/message';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get('chatId');

  if (!chatId) {
    return new Response('chatId is required', { status: 400 });
  }

  return toHTTPResponse(await getMessageVotes(chatId));
}

export async function PATCH(request: Request) {
  const {
    chatId,
    messageId,
    type,
  }: { chatId: string; messageId: string; type: 'up' | 'down' } =
    await request.json();

  if (!chatId || !messageId || !type) {
    return new Response('messageId and type are required', { status: 400 });
  }

  return toHTTPResponse(await updateMessageVote(chatId, messageId, type));
}
