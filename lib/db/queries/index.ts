import 'server-only';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres, { type PostgresError } from 'postgres';

import * as schema from '../schema';

const client = postgres(process.env.POSTGRES_URL as string);
export const db = drizzle(client, { schema });

export const isUniqueConstraintError = (
  error: unknown,
): error is PostgresError => {
  /** https://github.com/porsager/postgres/pull/901 */
  return (error as Error & { code?: string })?.code === '23505';
};
