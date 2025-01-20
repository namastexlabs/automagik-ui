import type { ZodIssue } from "zod";

export type ActionStateStatus = { status: 'failed' | 'invalid_data' | 'success' | 'idle' | 'in_progress'; };

export type ActionStateData<T = any> = ActionStateStatus & {
  data: T | null;
  errors?: ZodIssue[]
};
