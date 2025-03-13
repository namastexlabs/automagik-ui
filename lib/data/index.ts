/**
 * @fileoverview Top-level layer for data access.
 * It is responsible for fetching and saving resources on API routes, server actions, and server components.
 * It also contains DTOs and schema for the resource form.
 */

export enum DataStatus {
  NotFound = 'not_found',
  InvalidData = 'invalid_data',
  Unauthorized = 'unauthorized',
  Conflict = 'conflict',
  Success = 'success',
  Unexpected = 'unexpected',
}
