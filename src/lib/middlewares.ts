import type { RequestHandler } from "express";
import z from "zod";
import { decodeToken } from "./jwt.js";

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
