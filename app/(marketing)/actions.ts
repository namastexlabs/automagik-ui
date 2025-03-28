'use server';

import { joinWaitlist } from '@/lib/data/waitlist';

export async function joinWaitlistAction(
  _: Awaited<ReturnType<typeof joinWaitlist>>,
  formData: FormData,
) {
  return await joinWaitlist({
    name: formData.get('name'),
    email: formData.get('email'),
  });
}
