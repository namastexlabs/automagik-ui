export abstract class ApplicationError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 400,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApplicationError';
  }
}

export class NotFoundError extends ApplicationError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

export class InvalidDataError extends ApplicationError {
  constructor(message = 'Invalid data') {
    super(message, 400);
  }
}

export class UnauthorizedError extends ApplicationError {
  constructor(message = 'Unauthorized access') {
    super(message, 401);
  }
}

export class ConflictError extends ApplicationError {
  constructor(message = 'Resource already exists') {
    super(message, 409);
  }
}
