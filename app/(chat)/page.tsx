import { cookies } from 'next/headers';

import { getUser } from '@/lib/auth';
import { Chat } from '@/components/chat';
import {
  type ChatModel,
  DEFAULT_CHAT_MODEL,
  DEFAULT_PROVIDER,
  isModelValid,
} from '@/lib/ai/models';
import { AGENT_COOKIE_KEY } from '@/lib/agents/cookies';
import { MODEL_COOKIE_KEY, PROVIDER_COOKIE_KEY } from '@/lib/ai/cookies';
import { getInitialAgents } from '@/lib/data/agent';

export default async function Page() {
  const session = await getUser();

  const cookieStore = await cookies();
  const agentsData = await getInitialAgents();

  if (agentsData.errors) {
    throw new Error(JSON.stringify(agentsData.errors));
  }

  const tabCookie = cookieStore.get(AGENT_COOKIE_KEY)?.value;
  const providerFromCookie = cookieStore.get(PROVIDER_COOKIE_KEY)
    ?.value as keyof ChatModel;
  const modelIdFromCookie = cookieStore.get(MODEL_COOKIE_KEY)
    ?.value as keyof ChatModel[typeof providerFromCookie];

  const agent = agentsData.data.find((agent) => agent.id === tabCookie);

  const [provider, modelId] =
    providerFromCookie &&
    modelIdFromCookie &&
    isModelValid(providerFromCookie, modelIdFromCookie)
      ? [providerFromCookie, modelIdFromCookie]
      : [DEFAULT_PROVIDER, DEFAULT_CHAT_MODEL];

  return (
    <Chat
      initialMessages={[]}
      initialAgents={agentsData.data}
      modelId={modelId}
      provider={provider}
      selectedVisibilityType="private"
      isReadonly={
        agent?.visibility === 'private' && agent?.userId !== session.user.id
      }
    />
  );
}
