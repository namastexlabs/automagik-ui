import 'server-only';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import type { AuthError } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/supabase/server';
import { isEmailApprovedInWaitlist } from '@/lib/db/queries/waitlist';

export async function getUser() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return {
    user: {
      id: user.id,
      email: user.email as string,
    },
  };
}

export async function isEmailValid(email: string) {
  if (z.string().email().safeParse(email).success) {
    if (email.endsWith('namastex.ai')) {
      return true;
    }

    const isApprovedInWaitlist = await isEmailApprovedInWaitlist(email);
    return isApprovedInWaitlist;
  }

  return false;
}

export function handleLoginError(error: AuthError) {
  if (error.status === 400) {
    return 'Invalid credentials';
  }

  return 'An unexpected error occurred';
}

export function handleSignupError(error: AuthError) {
  if (error.code && error.code === 'weak_password') {
    return error.message;
  }

  return 'An unexpected error occurred';
}
