import z from "zod";
import jwt from "jsonwebtoken";
import { decodeToken } from "./jwt.js";
import { HttpError, UnauthorizedError } from "./errors.js";
import type { Request, Response, NextFunction, RequestHandler } from "express";

export const validate =
  (type: "params" | "body" | "query", schema: z.ZodType): RequestHandler =>
  (req, res, next) => {
    const result = schema.safeParse(req[type]);

    if (!result.success) {
      return res.status(400).json({ error: z.treeifyError(result.error) });
    }

    req[type] = result.data;
    next();
  };

function isCorrectPayload(obj: unknown): obj is { userId: string } {
  return typeof obj === "object" && obj !== null && "userId" in obj;
}

export const requireAuth: RequestHandler = (req, res, next) => {
  const bearerToken = req.headers.authorization;

  if (!bearerToken || !bearerToken.startsWith("Bearer ")) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const token = bearerToken.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "unauthorized" });
  }

  let decodedToken;

  try {
    decodedToken = decodeToken(token);
  } catch {
    return res.status(401).json({ error: "invalid or expired token" });
  }

  if (!isCorrectPayload(decodedToken)) {
    return res.status(401).json({ error: "invalid or expired token" });
  }

  req.user = decodedToken;
  next();
};

export const routeNotFound: RequestHandler = (req, res, next) => {
  return res.status(404).json({ error: "endpoint does not exist" });
};

function hasCode(value: unknown): value is { code: string } {
  return typeof value === "object" && value !== null && "code" in value;
}

function normalizeError(err: unknown) {
  if (err instanceof HttpError) return err;

  if (err instanceof jwt.TokenExpiredError) {
    return new UnauthorizedError("Token expired");
  }

  if (err instanceof jwt.JsonWebTokenError) {
    return new UnauthorizedError("Invalid token");
  }

  if (
    typeof err === "object" &&
    err !== null &&
    "cause" in err &&
    hasCode(err.cause)
  ) {
    switch (err.cause.code) {
      case "23505":
        return new HttpError(409, "Unique property violated", "DB_ERROR");
      case "23502":
        return new HttpError(400, "Missing required field", "DB_ERROR");
      default:
        return new HttpError(500, "Database error", "DB_ERROR");
    }
  }

  return new HttpError();
}

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!(err instanceof HttpError)) {
    console.error({
      message: (err as Error).message,
      stack: (err as Error).stack,
      path: req.path,
      method: req.method,
    });
  }

  const e = normalizeError(err);

  return res.status(e.status).json(e.toJSON());
};
