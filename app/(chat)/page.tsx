import { cookies } from 'next/headers';

import { Chat } from '@/components/chat';
import {
  type ChatModel,
  DEFAULT_CHAT_MODEL,
  DEFAULT_PROVIDER,
  isModelValid,
} from '@/lib/ai/models';
import { MODEL_COOKIE_KEY, PROVIDER_COOKIE_KEY } from '@/lib/ai/cookies';
import { getAgent } from '@/lib/data/agent';

export default async function Page({
  searchParams,
}: { searchParams: Promise<{ agent?: string }> }) {
  const { agent: agentId } = await searchParams;
  const agentData = agentId ? await getAgent(agentId) : null;

  if (agentData?.errors) {
    throw new Error(JSON.stringify(agentData.errors));
  }

  const agent = agentData?.data || null;
  const cookieStore = await cookies();
  const providerFromCookie = cookieStore.get(PROVIDER_COOKIE_KEY)
    ?.value as keyof ChatModel;
  const modelIdFromCookie = cookieStore.get(MODEL_COOKIE_KEY)
    ?.value as keyof ChatModel[typeof providerFromCookie];

  const [provider, modelId] =
    providerFromCookie &&
    modelIdFromCookie &&
    isModelValid(providerFromCookie, modelIdFromCookie)
      ? [providerFromCookie, modelIdFromCookie]
      : [DEFAULT_PROVIDER, DEFAULT_CHAT_MODEL];

  return (
    <Chat
      initialMessages={[]}
      initialAgent={agent}
      modelId={modelId}
      provider={provider}
      selectedVisibilityType="private"
      isReadonly={false}
    />
  );
}
