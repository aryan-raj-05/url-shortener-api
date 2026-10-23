import { Router } from "express";
import { asyncHandler } from "../../lib/async.js";
import { requireAuth } from "../../lib/middlewares.js";
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
  .post("/", asyncHandler(createShortUrl))
  .patch("/:shortUrl", asyncHandler(updateShortUrl))
  .delete("/:shortUrl", asyncHandler(deleteShortUrl));

export { urlRouter };
