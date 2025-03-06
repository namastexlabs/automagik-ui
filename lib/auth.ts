import { createServerClient } from './supabase/server';

export async function getUser() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return {
    user: {
      id: user.id,
      email: user.email as string,
    }
  };
}