export class HttpError extends Error {
  status: number;
  code?: string;

  constructor(
    status = 500,
    message = "Internal Server Error",
    code = "INTERNAL_ERROR",
  ) {
    super(message);

    Object.setPrototypeOf(this, new.target.prototype);

    this.status = status;
    this.code = code;
  }

  toJSON() {
    return {
      error: this.message,
      code: this.code,
    };
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = "Invalid credentials") {
    super(401, message, "AUTH_INVALID");
  }
}

export class BadRequestError extends HttpError {
  constructor(message = "Bad Request") {
    super(400, message, "BAD_REQUEST");
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = "Forbidden") {
    super(403, message, "FORBIDDEN");
  }
}

export class NotFoundError extends HttpError {
  constructor(message = "Not Found") {
    super(404, message, "NOT_FOUND");
  }
}

export class GoneError extends HttpError {
  constructor(message = "Resource is no longer available") {
    super(410, message, "RESOURCE_NOT_AVAILABLE");
  }
}
