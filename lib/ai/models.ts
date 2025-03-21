export enum ModelSupport {
  IMAGE = 'image',
  TOOLS = 'tools',
  REASONING = 'reasoning',
  EXTENDED_THINKING = 'extended_thinking',
}

export type ModelData = {
  name: string;
  supports: ModelSupport[];
};

const createModelData = (name: string, supports: ModelSupport[]): ModelData => {
  return {
    name,
    supports,
  };
};

export const chatModels = {
  openai: {
    'gpt-4o': createModelData('GPT-4o', [
      ModelSupport.IMAGE,
      ModelSupport.TOOLS,
    ]),
    'gpt-4o-mini': createModelData('GPT-4o Mini', [
      ModelSupport.IMAGE,
      ModelSupport.TOOLS,
    ]),
    'gpt-4-turbo': createModelData('GPT-4 Turbo', [
      ModelSupport.IMAGE,
      ModelSupport.TOOLS,
    ]),
    o1: createModelData('GPT-o1', [ModelSupport.IMAGE, ModelSupport.TOOLS]),
    'o1-mini': createModelData('GPT-o1 Mini', [
      ModelSupport.IMAGE,
      ModelSupport.TOOLS,
    ]),
    'o3-mini': createModelData('GPT-o3 Mini', [ModelSupport.TOOLS]),
  },
  anthropic: {
    'claude-3-5-sonnet-latest': createModelData('Claude 3.5 Sonnet', [
      ModelSupport.IMAGE,
      ModelSupport.TOOLS,
      ModelSupport.REASONING,
    ]),
    'claude-3-5-haiku-latest': createModelData('Claude 3.5 Haiku', [
      ModelSupport.TOOLS,
      ModelSupport.REASONING,
    ]),
    'claude-3-opus-latest': createModelData('Claude 3 Opus', [
      ModelSupport.IMAGE,
      ModelSupport.TOOLS,
      ModelSupport.REASONING,
    ]),
    'claude-3-7-sonnet-20250219': createModelData('Claude 3.7 Sonnet', [
      ModelSupport.IMAGE,
      ModelSupport.TOOLS,
      ModelSupport.REASONING,
      ModelSupport.EXTENDED_THINKING
    ]),
  },
  google: {
    'gemini-2.0-flash': createModelData('Gemini 2.0 Flash', [
      ModelSupport.IMAGE,
      ModelSupport.TOOLS,
    ]),
    'gemini-2.0-flash-exp': createModelData('Gemini 2.0 Flash Experimental', [
      ModelSupport.IMAGE,
      ModelSupport.TOOLS,
    ]),
    'gemini-2.0-pro-exp-02-05': createModelData('Gemini 2.0 Pro Exp 02-05', [
      ModelSupport.IMAGE,
      ModelSupport.TOOLS,
    ]),
    'gemini-2.0-flash-lite-preview-02-05': createModelData(
      'Gemini 2.0 Flash Lite Preview 02-05',
      [ModelSupport.IMAGE, ModelSupport.TOOLS],
    ),
    'gemini-1.5-pro-latest': createModelData('Gemini 1.5 Pro', [
      ModelSupport.IMAGE,
      ModelSupport.TOOLS,
    ]),
    'gemini-1.5-flash': createModelData('Gemini 1.5 Flash', [
      ModelSupport.IMAGE,
      ModelSupport.TOOLS,
    ]),
  },
  groq: {
    'deepseek-r1-distill-llama-70b': createModelData(
      'DeepSeek R1 Distill LLaMA 70B',
      [ModelSupport.REASONING],
    ),
    'deepseek-r1-distill-qwen-32b': createModelData(
      'DeepSeek R1 Distill Qwen 32B',
      [ModelSupport.REASONING],
    ),
    'llama-3.3-70b-versatile': createModelData('LLaMA 3.3 70B Versatile', [
      ModelSupport.TOOLS,
    ]),
  },
  togetherai: {
    'deepseek-ai/DeepSeek-V3': createModelData('DeepSeek V3', []),
    'deepseek-ai/DeepSeek-R1': createModelData('DeepSeek R1', [
      ModelSupport.REASONING,
    ]),
    'deepseek-ai/DeepSeek-R1-Distill-Llama-70B': createModelData(
      'DeepSeek R1 Distill LLaMA 70B',
      [ModelSupport.REASONING],
    ),
    'meta-llama/Llama-3.3-70B-Instruct-Turbo': createModelData(
      'Llama 3.3 70B Instruct Turbo',
      [ModelSupport.TOOLS],
    ),
    'Qwen/QwQ-32B-Preview': createModelData('QwQ 32B Preview', []),
    'Qwen/Qwen2.5-Coder-32B-Instruct': createModelData(
      'Qwen2.5 Coder 32B Instruct',
      [],
    ),
    'Qwen/Qwen2-VL-72B-Instruct': createModelData('Qwen2 VL 72B Instruct', []),
    'Qwen/Qwen2-72B-Instruct': createModelData('Qwen2 72B Instruct', []),
  },
  mistral: {
    'codestral-latest': createModelData('Codestral Large', [
      ModelSupport.TOOLS,
    ]),
    'pixtral-large-latest': createModelData('Pixtral Large', [
      ModelSupport.TOOLS,
      ModelSupport.IMAGE,
    ]),
    'mistral-small-latest': createModelData('Mistral Small', [
      ModelSupport.TOOLS,
    ]),
    'mistral-large-latest': createModelData('Mistral Large', [
      ModelSupport.TOOLS,
    ]),
  },
} as const;

const modelIcons = {
  openai: '/images/openai.svg',
  anthropic: '/images/anthropic.png',
  google: '/images/google.png',
  groq: '/images/groq.svg',
  togetherai: null,
  mistral: '/images/mistral.png',
} as const;

export const imageModels = {
  openai: {
    'dall-e-3': { name: 'DALL-E 3' },
  },
  togetherai: {
    'stabilityai/stable-diffusion-xl-base-1.0': { name: 'Stable Diffusion XL' },
    'black-forest-labs/FLUX.1-dev': { name: 'FLUX 1 Dev' },
    'black-forest-labs/FLUX.1-dev-lora': { name: 'FLUX 1 Dev Lora' },
    'black-forest-labs/FLUX.1-schnell': { name: 'FLUX 1 Schnell' },
    'black-forest-labs/FLUX.1-canny': { name: 'FLUX 1 Canny' },
    'black-forest-labs/FLUX.1-depth': { name: 'FLUX 1 Depth' },
    'black-forest-labs/FLUX.1-redux': { name: 'FLUX 1 Redux' },
    'black-forest-labs/FLUX.1.1-pro': { name: 'FLUX 1.1 Pro' },
    'black-forest-labs/FLUX.1-pro': { name: 'FLUX 1 Pro' },
    'black-forest-labs/FLUX.1-schnell-Free': { name: 'FLUX 1 Schnell Free' },
  },
} as const;

export type ChatModel = typeof chatModels;
export type ImageModel = typeof imageModels;

export const DEFAULT_PROVIDER: keyof ChatModel = 'openai';
export const DEFAULT_CHAT_MODEL: keyof ChatModel[typeof DEFAULT_PROVIDER] =
  'gpt-4o-mini';

export const isModelValid = (provider: string, modelId: string) =>
  provider in chatModels && modelId in chatModels[provider as keyof ChatModel];

export const isExtendedThinkingAllowed = (model: ModelData) =>
  model.supports.includes(ModelSupport.EXTENDED_THINKING);

export const isImagesAllowed = (model: ModelData) =>
  model.supports.includes(ModelSupport.IMAGE);

export const isToolsAllowed = (model: ModelData) =>
  model.supports.includes(ModelSupport.TOOLS);

export const isReasoningAllowed = (model: ModelData) =>
  model.supports.includes(ModelSupport.REASONING);

export const getModelData = (provider: string, modelId: string) => {
  const modelIdString = modelId as string;
  const models = chatModels[provider as keyof ChatModel];
  return models[modelIdString as keyof typeof models] as ModelData;
};

export const getModelIcon = (provider: string) => {
  return modelIcons[provider as keyof typeof modelIcons];
};

export const accessModel = <T extends keyof ChatModel>(
  provider: T,
  model: keyof ChatModel[T],
) => {
  return [provider, model] as const;
};
