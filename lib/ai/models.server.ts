import 'server-only';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { deepseek } from '@ai-sdk/deepseek';
import { fireworks } from '@ai-sdk/fireworks';
import { groq } from '@ai-sdk/groq';
import {
  extractReasoningMiddleware,
  type LanguageModelV1,
  wrapLanguageModel,
} from 'ai';
import {
  type ChatModel,
  type ImageModel,
  ModelSupport,
  chatModels,
} from './models';

export function getModel(provider: string, modelId: string) {
  const modelIdString = modelId as string;
  let model: LanguageModelV1;

  switch (provider) {
    case 'openai':
      model = openai(modelIdString);
      break;
    case 'anthropic':
      model = anthropic(modelIdString);
      break;
    case 'google':
      model = google(modelIdString);
      break;
    case 'deepseek':
      model = deepseek(modelIdString);
      break;
    case 'fireworks':
      model = fireworks(modelIdString);
      break;
    case 'groq':
      model = groq(modelIdString);
      break;
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }

  const chatModelsFromProvider = chatModels[provider as keyof ChatModel];
  const supports = (
    chatModelsFromProvider[modelId as keyof typeof chatModelsFromProvider] as {
      name: string;
      supports: ModelSupport[];
    }
  ).supports;

  if (supports.includes(ModelSupport.REASONING)) {
    model = wrapLanguageModel({
      model,
      middleware: extractReasoningMiddleware({ tagName: 'think' }),
    });
  }

  return model;
}

export const getImageModel = <T extends keyof ImageModel>(
  provider: T,
  modelId: keyof ImageModel[T],
) => {
  if (provider === 'openai') {
    return openai.image(modelId as string);
  }

  throw new Error(`Unknown provider: ${provider}`);
};
