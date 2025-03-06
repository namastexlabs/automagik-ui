import { createServerClient as createClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { NextRequest, NextResponse } from 'next/server';

export async function createServerClient() {
  const cookieStore = await cookies();

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      cookies: {
        getAll: () => {
          return Array.from(cookieStore.getAll());
        },
        setAll: (cookieValues) => {
          cookieValues.forEach((cookie) => {
            cookieStore.set(cookie);
          });
        },
      },
    },
  );
}

export function createMiddlewareClient(
  requestCookies: NextRequest['cookies'],
  responseCookies: NextResponse['cookies'],
) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      cookies: {
        getAll: () => {
          return Array.from(requestCookies.getAll());
        },
        setAll: (cookieValues) => {
          cookieValues.forEach((cookie) => {
            responseCookies.set(cookie);
          });
        },
      },
    },
  );
}
