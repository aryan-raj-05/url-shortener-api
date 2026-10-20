import type { RequestHandler } from "express";

export function asyncHandler(fn: RequestHandler): RequestHandler {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
