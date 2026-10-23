import express, { type Express } from "express";
import morgan from "morgan";
import { urlRouter } from "./modules/urls/urls.route.js";
import { authRouter } from "./modules/auth/auth.route.js";
import { getLongUrl } from "./modules/urls/urls.controller.js";
import { asyncHandler } from "./lib/async.js";
import { shortUrlParamSchema } from "./modules/urls/urls.schema.js";
import { errorHandler, routeNotFound } from "./lib/middlewares.js";
import rateLimit from "express-rate-limit";

const app: Express = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  ipv6Subnet: 56,
});

app.use(express.json());
app.use("/api", limiter);
app.use(morgan("tiny"));

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/urls", urlRouter);

app
  .get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
  })
  .get("/:shortUrl", asyncHandler(getLongUrl));

app.use(routeNotFound);
app.use(errorHandler);

export { app };
