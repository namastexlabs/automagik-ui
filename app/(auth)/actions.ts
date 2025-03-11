'use server';

import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { AuthError } from '@supabase/supabase-js';
import { createUser } from '@/lib/db/queries/user';

const authFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export interface LoginActionState {
  status: 'idle' | 'in_progress' | 'success' | 'failed' | 'invalid_data';
}

export const login = async (
  _: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> => {
  try {
    const validatedData = authFormSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
    });

    const supabase = await createServerClient();
    
    const { error } = await supabase.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password,
    });

    if (error) {
      console.error('Login error:', error);
      return { status: 'failed' };
    }

    return { status: 'success' };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: 'invalid_data' };
    }
    return { status: 'failed' };
  }
};

export type RegisterActionState = {
  status: 
    | 'idle' 
    | 'in_progress' 
    | 'success' 
    | 'failed' 
    | 'invalid_data' 
    | 'user_exists'
    | 'invalid_email'
    | 'weak_password';
}

export const register = async (
  _: RegisterActionState,
  formData: FormData,
): Promise<RegisterActionState> => {
  try {
    const validatedData = authFormSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
    });

    const supabase = await createServerClient();

    const { error: signUpError, data: { user: supabaseUser } } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    });

    if (signUpError) {
      if (signUpError instanceof AuthError) {
        switch (signUpError.status) {
          case 400:
            if (signUpError.code === 'user_already_exists') {
              return { status: 'user_exists' };
            }
            if (signUpError.code === 'email_address_invalid') {
              return { status: 'invalid_email' };
            }
            if (signUpError.code === 'weak_password') {
              return { status: 'weak_password' };
            }
            break;
          default:
            console.error('Signup error:', signUpError);
        }
      }
      return { status: 'failed' };
    }

    if (!supabaseUser?.id) {
      console.error('No user ID returned from Supabase');
      return { status: 'failed' };
    }

    await createUser(supabaseUser.id, validatedData.email);

    return { status: 'success' };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: 'invalid_data' };
    }
    console.error('Registration error:', error);
    return { status: 'failed' };
  }
};
