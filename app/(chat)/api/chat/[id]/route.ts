import { auth } from "@/app/(auth)/auth";
import { getChatById } from "@/lib/db/queries";


export async function GET(request: Request) {
  const id = new URL(request.url).pathname.split('/').pop();

  const session = await auth();

  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (!id) {
    return new Response('Missing id', { status: 400 });
  }

  const chat = await getChatById({ id });

  if (!chat || chat.userId !== session.user.id) {
    return new Response('Chat not found', { status: 404 });
  }

  return Response.json(chat, { status: 200 });
}
