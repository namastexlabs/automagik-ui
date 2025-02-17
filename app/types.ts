import type { z, ZodFormattedError } from "zod";

export type ActionStateStatus = { status: 'failed' | 'invalid_data' | 'success' | 'idle' | 'in_progress'; };

export type ActionStateData<DATA = any, SCHEMA extends z.ZodType = z.ZodType> = ActionStateStatus & {
  data: DATA | null;
  errors?: ZodFormattedError<z.infer<SCHEMA>>
};
