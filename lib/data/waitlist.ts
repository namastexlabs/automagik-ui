import 'server-only';
import { z } from 'zod';

import { joinWaitlist as joinWaitlistRepository } from '@/repositories/waitlist';

import {
  handleDataError,
  type ZodLooseInfer,
  type DataResponse,
} from './index.server';
import { DataStatus } from '.';

const waitListSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().min(1),
});

export async function joinWaitlist(
  data: ZodLooseInfer<typeof waitListSchema>,
): Promise<DataResponse<null>> {
  try {
    const values = waitListSchema.parse(data);
    await joinWaitlistRepository(values);

    return {
      status: DataStatus.Success,
      data: null,
    };
  } catch (error) {
    return handleDataError(error);
  }
}
