import 'server-only';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres, { type PostgresError } from 'postgres';

import * as schema from '../schema';

function devSingleton<Value>(name: string, value: () => Value): Value {
  if (process.env.NODE_ENV === 'production') {
    return value();
  }

  const globalAny: any = global;
  globalAny.__singletons = globalAny.__singletons || {};

  if (!globalAny.__singletons[name]) {
    globalAny.__singletons[name] = value();
  }
  
  return globalAny.__singletons[name];
}

function createDatabaseConnection() {
  const client = postgres(process.env.POSTGRES_URL as string);
  return drizzle(client, { schema });
}

export const db = devSingleton('db', createDatabaseConnection);

export const isUniqueConstraintError = (
  error: unknown,
): error is PostgresError => {
  /** https://github.com/porsager/postgres/pull/901 */
  return (error as Error & { code?: string })?.code === '23505';
};

export { schema };
