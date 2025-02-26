'use client';

import type { PropsWithChildren } from 'react';

import { UserContext, type UserContextValue } from '@/contexts/user';

export function UserProvider({
  user,
  children,
}: PropsWithChildren<UserContextValue>) {
  return (
    <UserContext
      value={{
        user: {
          id: user.id,
          email: user.email,
        },
      }}
    >
      {children}
    </UserContext>
  );
}
