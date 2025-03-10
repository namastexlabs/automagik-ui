import 'server-only';
import { eq } from 'drizzle-orm';

import * as schema from '../schema';
import { db } from './index';

export async function getUser(email: string): Promise<schema.User | undefined> {
  try {
    const user = await db.query.user.findFirst({
      where: eq(schema.user.email, email),
    });

    return user;
  } catch (error) {
    console.error('Failed to get user from database');
    throw error;
  }
}

export async function createUser(id: string, email: string) {
  try {
    return await db.insert(schema.user).values({ id, email });
  } catch (error) {
    console.error('Failed to create user in database');
    throw error;
  }
} 