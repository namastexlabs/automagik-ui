import 'server-only';

import { db, schema } from '.';

export async function addToWaitlist(data: { name: string; email: string }) {
  try {
    await db.insert(schema.waitlist).values(data);
  } catch (error) {
    console.error(error);
    throw error;
  }
}
