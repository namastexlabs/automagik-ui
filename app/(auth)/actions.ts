'use server';

import { redirect, RedirectType } from 'next/navigation';

import { createServerClient } from '@/lib/supabase/server';

export async function login(formData: FormData) {
  const supabase = await createServerClient();

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    return { error };
  }

  redirect('/chat/welcome', RedirectType.replace);
}

export async function signup(formData: FormData) {
  const supabase = await createServerClient();

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/chat/welcome`,
    },
  };

  const { error } = await supabase.auth.signUp(data);

  if (error) {
    return { error };
  }

  redirect('/login?signup=true');
}

export async function updatePassword(password: string) {
  const supabase = await createServerClient();

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error };
  }

  redirect('/chat/welcome', RedirectType.replace);
}

export async function resetPassword(email: string) {
  const supabase = await createServerClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email);

  if (error) {
    return { error };
  }
}
