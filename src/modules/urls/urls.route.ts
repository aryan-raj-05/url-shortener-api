import { Router } from "express";
import { asyncHandler } from "../../lib/async.js";
import { requireAuth, validate } from "../../lib/middlewares.js";
import { createShortUrl, getLongUrl } from "./urls.controller.js";
import {
  createShortUrlBodySchema,
  shortUrlParamSchema,
} from "./urls.schema.js";

const urlRouter: Router = Router();

urlRouter
  .get(
    "/:shortUrl",
    validate("params", shortUrlParamSchema),
    asyncHandler(getLongUrl),
  )
  .post(
    "/",
    requireAuth,
    validate("body", createShortUrlBodySchema),
    asyncHandler(createShortUrl),
  );

export { urlRouter };
