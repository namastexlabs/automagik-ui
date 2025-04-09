'use server';

import { redirect, RedirectType } from 'next/navigation';

import { createServerClient } from '@/lib/supabase/server';
import { handleLoginError, handleSignupError, isEmailValid } from '@/lib/auth';

export async function login(formData: FormData) {
  const supabase = await createServerClient();

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    return { error: handleLoginError(error) };
  }

  redirect('/chat/welcome', RedirectType.replace);
}

export async function signup(formData: FormData) {
  if (!(await isEmailValid(formData.get('email') as string))) {
    return { error: 'Invalid e-mail address' };
  }

  const supabase = await createServerClient();

  const { error } = await supabase.auth.signUp({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  });

  if (error) {
    return { error: handleSignupError(error) };
  }

  redirect('/login?signup=true');
}

export async function updatePassword(password: string) {
  const supabase = await createServerClient();

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: handleLoginError(error) };
  }

  redirect('/chat/welcome', RedirectType.replace);
}

export async function resetPassword(email: string) {
  const supabase = await createServerClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email);

  if (error) {
    return { error: handleLoginError(error) };
  }
}
