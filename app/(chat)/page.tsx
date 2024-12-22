import { cookies } from 'next/headers';

import { auth } from '@/app/(auth)/auth';
import { Chat } from '@/components/chat';
import { DEFAULT_MODEL_NAME, models } from '@/lib/ai/models';
import { generateUUID } from '@/lib/utils';
import { getAgentsByUserId } from '@/lib/db/queries';

export default async function Page() {
  const id = generateUUID();

  const session = await auth();
  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get('model-id')?.value;

  const agentsFromDb =
    session?.user?.id ? await getAgentsByUserId({ userId: session?.user.id }) : [];

  const selectedModelId =
    models.find((model) => model.id === modelIdFromCookie)?.id ||
    DEFAULT_MODEL_NAME;

  return (
    <Chat
      key={id}
      id={id}
      initialMessages={[]}
      agents={agentsFromDb}
      selectedModelId={selectedModelId}
      selectedVisibilityType="private"
      isReadonly={false}
    />
  );
}
