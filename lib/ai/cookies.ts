import { addDays } from 'date-fns';

export const MODEL_COOKIE_KEY = 'model:id';
export const PROVIDER_COOKIE_KEY = 'model:provider';

export const setModelCookie = (provider: string, modelId: string) => {
  document.cookie = `${MODEL_COOKIE_KEY}=${String(modelId)}; expires=${addDays(new Date(), 5).toUTCString()}; path=/`;
  document.cookie = `${PROVIDER_COOKIE_KEY}=${provider}; expires=${addDays(new Date(), 5).toUTCString()}; path=/`;
};

export const resetModelCookie = () => {
  document.cookie = `${MODEL_COOKIE_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
  document.cookie = `${PROVIDER_COOKIE_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
};
