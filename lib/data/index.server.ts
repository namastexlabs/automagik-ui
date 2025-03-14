/**
 * @fileoverview Top-level layer for data access.
 * It is responsible for fetching and saving resources on API routes, server actions, and server components.
 * It also contains DTOs and schema for the resource form.
 */

import 'server-only';
import { z, type ZodTypeAny } from 'zod';
import { NextResponse } from 'next/server';

import { ApplicationError, FieldBasedError } from '@/lib/errors';
import { DataStatus } from '.';

export type ZodLooseInfer<T extends ZodTypeAny> = T extends z.ZodObject<
  infer Shape
>
  ? { [K in keyof Shape]: ZodLooseInfer<Shape[K]> }
  : unknown;

export type DataResponse<DATA, MODEL = any> = {
  status: DataStatus;
  data: DATA;
  errors?: {
    [Key in keyof MODEL]?: string[];
  } & { _errors?: string[] };
};

type ExtractModel<ERROR extends FieldBasedError<any> | ApplicationError> =
  ERROR extends FieldBasedError<infer MODEL> ? MODEL : any;

const ERROR_STATUS_CODES = {
  [DataStatus.NotFound]: 404,
  [DataStatus.InvalidData]: 422,
  [DataStatus.Unauthorized]: 401,
  [DataStatus.Conflict]: 409,
  [DataStatus.Unexpected]: 500,
} as const;

export function getErrorStatusCode(status: DataStatus) {
  if (status === DataStatus.Success) {
    throw new Error('Success status code is not allowed');
  }

  return ERROR_STATUS_CODES[status];
}

export function handleZodError<MODEL>(
  error: z.ZodError<MODEL>,
): DataResponse<null, MODEL> {
  return {
    status: DataStatus.InvalidData,
    data: null,
    errors: {
      _errors: error.flatten().formErrors,
      ...(error.flatten().fieldErrors as DataResponse<null, MODEL>['errors']),
    },
  };
}

export function handleApplicationError<
  ERROR extends FieldBasedError<any> | ApplicationError,
>(error: ERROR): DataResponse<null, ExtractModel<ERROR>> {
  if (error instanceof FieldBasedError && error.errors) {
    return {
      status: error.status,
      data: null,
      errors: error.errors,
    };
  }

  return {
    status: error.status,
    data: null,
    errors: {
      _errors: [error.message],
    },
  };
}

export function handleDataError<MODEL>(
  error: any,
  defaultValue: any = null,
): DataResponse<any, MODEL> {
  if (isZodError(error)) {
    return handleZodError(error);
  }

  if (error instanceof ApplicationError) {
    return handleApplicationError(error);
  }

  return {
    status: DataStatus.Unexpected,
    data: defaultValue,
    errors: {
      _errors: ['Something went wrong'],
    },
  };
}

export function isZodError<MODEL>(error: any): error is z.ZodError<MODEL> {
  return error instanceof z.ZodError;
}

export function isFieldBasedError<MODEL>(
  error: any,
): error is FieldBasedError<MODEL> {
  return error instanceof FieldBasedError;
}

export function toHTTPResponse(response: DataResponse<any, any>): NextResponse {
  if (response.status === DataStatus.Success) {
    return NextResponse.json(response.data);
  }

  return new NextResponse(
    response.errors ? JSON.stringify(response.errors) : null,
    {
      status: getErrorStatusCode(response.status),
    },
  );
}
