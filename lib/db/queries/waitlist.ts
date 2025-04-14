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

export async function isEmailApprovedInWaitlist(email: string) {
  try {
    const data = await db.query.waitlist.findFirst({
      where: (waitlist, { eq, and }) =>
        and(eq(waitlist.email, email), eq(waitlist.isApproved, true)),
    });

    return !!data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
