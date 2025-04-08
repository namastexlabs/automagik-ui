'use server';

import type { Message } from 'ai';

import type { VisibilityType } from '@/components/visibility-selector';
import { saveAgent, duplicateAgent, deleteAgent } from '@/lib/data/agent';
import { createChat, deleteChat, updateChatVisibility } from '@/lib/data/chat';
import { saveFlowTool } from '@/lib/data/tool';
import { deleteTrailingMessages } from '@/lib/data/message';

export async function deleteTrailingMessagesAction(id: string) {
  return deleteTrailingMessages(id);
}

export async function updateChatVisibilityAction(
  chatId: string,
  visibility: VisibilityType,
) {
  return updateChatVisibility(chatId, visibility);
}

export async function createChatAction(agentId: string, messages: Message[]) {
  return createChat(agentId, messages);
}

export async function deleteChatAction(id: string) {
  return deleteChat(id);
}

export async function saveAgentAction(
  _: Awaited<ReturnType<typeof saveAgent>>,
  formData: FormData,
): ReturnType<typeof saveAgent> {
  const data = {
    name: formData.get('name'),
    systemPrompt: formData.get('systemPrompt'),
    tools: formData.getAll('tools'),
    visibility: formData.get('visibility'),
    heartbeat: formData.has('heartbeat'),
    description: formData.get('description'),
    avatarFile: formData.has('avatarFile')
      ? formData.get('avatarFile')
      : undefined,
    dynamicBlocks: formData
      .getAll('dynamicBlocks')
      .map((item) => JSON.parse(item as string)),
  };

  const id = formData.get('id') as string;
  return saveAgent(data, id);
}

export async function duplicateAgentAction(
  _: Awaited<ReturnType<typeof saveAgent>>,
  id: string,
) {
  return duplicateAgent(id);
}

export async function deleteAgentAction(id: string) {
  return deleteAgent(id);
}

export async function saveFlowToolAction(
  _: Awaited<ReturnType<typeof saveFlowTool>>,
  formData: FormData,
): ReturnType<typeof saveFlowTool> {
  const id = formData.get('id') as string;
  const validatedData = {
    verboseName: formData.get('verboseName'),
    description: formData.get('description'),
    flowId: formData.get('flowId'),
    visibility: formData.get('visibility'),
  };

  return saveFlowTool(validatedData, id);
}
