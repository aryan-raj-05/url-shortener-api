import { Router } from "express";
import { asyncHandler } from "../../lib/async.js";
import { requireAuth, validate } from "../../lib/middlewares.js";
import {
  createShortUrlBodySchema,
  getAllUrlsQuerySchema,
  shortUrlParamSchema,
  updateShortUrlBodySchema,
} from "./urls.schema.js";
import {
  createShortUrl,
  deleteShortUrl,
  getAllUrlsCreatedByUser,
  updateShortUrl,
} from "./urls.controller.js";

const urlRouter: Router = Router();

urlRouter
  .use(requireAuth)
  .get("/", asyncHandler(getAllUrlsCreatedByUser))
  .post(
    "/",
    validate("body", createShortUrlBodySchema),
    asyncHandler(createShortUrl),
  )
  .patch(
    "/:shortUrl",
    validate("params", shortUrlParamSchema),
    validate("body", updateShortUrlBodySchema),
    asyncHandler(updateShortUrl),
  )
  .delete(
    "/:shortUrl",
    validate("params", shortUrlParamSchema),
    asyncHandler(deleteShortUrl),
  );

export { urlRouter };
