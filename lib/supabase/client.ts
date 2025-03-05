import { createBrowserClient as createClient } from '@supabase/ssr';

export const createBrowserClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      cookies: {
        getAll: () => {
          const pairs = document.cookie.split(';');
          return pairs.map((pair) => {
            const [name, ...rest] = pair.trim().split('=');
            return {
              name,
              value: rest.join('='),
            };
          });
        },
        setAll: (cookies) => {
          cookies.forEach(({ name, value }) => {
            document.cookie = `${name}=${value}; path=/; secure; SameSite=Lax`;
          });
        },
      },
    },
  );
