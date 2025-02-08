import { createContext, use } from 'react';

export type UserContextValue = {
  user: {
    id: string;
    email: string;
  };
};

export const UserContext = createContext<UserContextValue | null>(null);

export const useUser = () => {
  const context = use(UserContext);

  if (context === null) {
    throw new Error('useUser must be used within a UserProvider');
  }

  return context;
};
