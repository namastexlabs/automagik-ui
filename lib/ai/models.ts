export enum ModelSupport {
  IMAGE = 'image',
  TOOLS = 'tools',
  REASONING = 'reasoning',
}

export const chatModels = {
  openai: {
    'gpt-4o': {
      name: 'GPT-4o',
      supports: [ModelSupport.IMAGE, ModelSupport.TOOLS],
    },
    'gpt-4o-mini': {
      name: 'GPT-4o Mini',
      supports: [ModelSupport.IMAGE, ModelSupport.TOOLS],
    },
    'gpt-4-turbo': {
      name: 'GPT-4 Turbo',
      supports: [ModelSupport.IMAGE, ModelSupport.TOOLS],
    },
    o1: { name: 'GPT-o1', supports: [ModelSupport.IMAGE, ModelSupport.TOOLS] },
    'o1-mini': {
      name: 'GPT-o1 Mini',
      supports: [ModelSupport.IMAGE, ModelSupport.TOOLS],
    },
    'o3-mini': { name: 'GPT-o3 Mini', supports: [ModelSupport.TOOLS] },
  },
  anthropic: {
    'claude-3-5-sonnet-latest': {
      name: 'Claude 3.5 Sonnet',
      supports: [ModelSupport.IMAGE, ModelSupport.TOOLS],
    },
    'claude-3-5-haiku-latest': {
      name: 'Claude 3.5 Haiku',
      supports: [ModelSupport.TOOLS],
    },
    'claude-3-5-hai-latest': {
      name: 'Claude 3.5 Hai',
      supports: [ModelSupport.IMAGE, ModelSupport.TOOLS],
    },
    'claude-3-5-opus-latest': {
      name: 'Claude 3.5 Opus',
      supports: [ModelSupport.IMAGE, ModelSupport.TOOLS],
    },
  },
  google: {
    'gemini-2.0-flash': {
      name: 'Gemini 2.0 Flash',
      supports: [ModelSupport.IMAGE, ModelSupport.TOOLS],
    },
    'gemini-2.0-flash-exp': {
      name: 'Gemini 2.0 Flash Experimental',
      supports: [ModelSupport.IMAGE, ModelSupport.TOOLS],
    },
    'gemini-2.0-pro-exp-02-05': {
      name: 'Gemini 2.0 Pro Exp 02-05',
      supports: [ModelSupport.IMAGE, ModelSupport.TOOLS],
    },
    'gemini-2.0-flash-lite-preview-02-05': {
      name: 'Gemini 2.0 Flash Lite Preview 02-05',
      supports: [ModelSupport.IMAGE, ModelSupport.TOOLS],
    },
    'gemini-1.5-pro-latest': {
      name: 'Gemini 1.5 Pro',
      supports: [ModelSupport.IMAGE, ModelSupport.TOOLS],
    },
    'gemini-1.5-flash': {
      name: 'Gemini 1.5 Flash',
      supports: [ModelSupport.IMAGE, ModelSupport.TOOLS],
    },
  },
  fireworks: {
    'accounts/fireworks/models/deepseek-r1': {
      name: 'DeepSeek R1',
      supports: [ModelSupport.REASONING],
    },
  },
  groq: {
    'gemma2-9b-it': { name: 'Gemma 2 9B IT', supports: [ModelSupport.TOOLS] },
    'gemma2-7b-it': { name: 'Gemma 2 7B IT', supports: [ModelSupport.TOOLS] },
    'llama3-70b-8192': {
      name: 'LLaMA 3 70B 8192',
      supports: [ModelSupport.TOOLS],
    },
    'mixtral-8x7b-32768': {
      name: 'Mixtral 8x7B 32768',
      supports: [ModelSupport.TOOLS],
    },
    'deepseek-r1-distill-llama-70b': {
      name: 'DeepSeek R1 Distill LLaMA 70B',
      supports: [ModelSupport.REASONING],
    },
  },
  togetherai: {
    'meta-llama/Llama-3-8b-chat-hf': {
      name: 'Llama 3.8B Chat',
      supports: [ModelSupport.IMAGE, ModelSupport.TOOLS],
    },
    'google/gemma-2b-it': {
      name: 'Gemma 2B IT',
      supports: [ModelSupport.IMAGE, ModelSupport.TOOLS],
    },
    'deepseek-ai/DeepSeek-V3': {
      name: 'DeepSeek V3',
      supports: [],
    },
    'deepseek-ai/DeepSeek-R1': {
      name: 'DeepSeek R1',
      supports: [ModelSupport.REASONING],
    },
  },
  mistral: {
    'pixtral-large-latest': {
      name: 'Pixtral Large',
      supports: [ModelSupport.TOOLS, ModelSupport.IMAGE],
    },
    'pixtral-12b-2409': {
      name: 'Pixtral 12B 2409',
      supports: [ModelSupport.TOOLS, ModelSupport.IMAGE],
    },
    'mistral-small-latest': {
      name: 'Mistral Small',
      supports: [ModelSupport.TOOLS],
    },
    'mistral-large-latest': {
      name: 'Mistral Large',
      supports: [ModelSupport.TOOLS],
    },
    'ministral-8b-latest': {
      name: 'Ministral 8B',
      supports: [ModelSupport.TOOLS],
    },
    'ministral-3b-latest': {
      name: 'Ministral 3B',
      supports: [ModelSupport.TOOLS],
    },
    'mistral-8x7b-32768': {
      name: 'Mistral 8x7B 32768',
      supports: [ModelSupport.TOOLS],
    },
  },
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
export type ModelData = { name: string; supports: ModelSupport[] };

export const DEFAULT_PROVIDER: keyof ChatModel = 'openai';
export const DEFAULT_CHAT_MODEL: keyof ChatModel[typeof DEFAULT_PROVIDER] =
  'gpt-4o-mini';

export const isModelValid = (provider: string, modelId: string) =>
  provider in chatModels && modelId in chatModels[provider as keyof ChatModel];

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

export const accessModel = <T extends keyof ChatModel>(
  provider: T,
  model: keyof ChatModel[T],
) => {
  return [provider, model] as const;
};
