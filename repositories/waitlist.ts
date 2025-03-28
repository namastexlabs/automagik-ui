'server-only';

import { addToWaitlist } from '@/lib/db/queries/waitlist';
import { ConflictError } from '@/lib/errors';
import { isUniqueConstraintError } from '@/lib/db/queries/index';

export async function joinWaitlist(data: { name: string; email: string }) {
  try {
    const result = await addToWaitlist(data);

    return result;
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new ConflictError('This email is already on the waitlist');
    }
    throw error;
  }
}
