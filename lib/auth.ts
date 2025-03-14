import { createServerClient } from './supabase/server';
import { redirect } from 'next/navigation';

export async function getUser() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return {
    user: {
      id: user.id,
      email: user.email as string,
    }
  };
}
