import 'server-only';
import { DataStatus } from './data';

export abstract class ApplicationError extends Error {
  status: DataStatus;
  constructor(message: string, status: DataStatus) {
    super(message);
    this.name = 'ApplicationError';
    this.status = status;
  }
}

export abstract class FieldBasedError<MODEL> extends ApplicationError {
  errors: Partial<Record<keyof MODEL, string[]>>;
  constructor(
    message = 'Invalid data',
    status: DataStatus = DataStatus.InvalidData,
    errors?: Partial<Record<keyof MODEL, string[]>>,
  ) {
    super(message, status);
    this.errors = errors ?? {};
  }
}

export class NotFoundError extends ApplicationError {
  constructor(message = 'Resource not found') {
    super(message, DataStatus.NotFound);
  }
}

export class UnauthorizedError extends ApplicationError {
  constructor(message = 'Unauthorized access') {
    super(message, DataStatus.Unauthorized);
  }
}

export class InvalidDataError<MODEL> extends FieldBasedError<MODEL> {
  constructor(
    message = 'Invalid data',
    errors?: Partial<Record<keyof MODEL, string[]>>,
  ) {
    super(message, DataStatus.InvalidData, errors);
  }
}

export class ConflictError<MODEL> extends FieldBasedError<MODEL> {
  constructor(
    message = 'Resource already exists',
    errors?: Partial<Record<keyof MODEL, string[]>>,
  ) {
    super(message, DataStatus.Conflict, errors);
  }
}
