import express, { type Express } from "express";
import morgan from "morgan";
import { urlRouter } from "./modules/urls/urls.route.js";
import { authRouter } from "./modules/auth/auth.route.js";
import { getLongUrl } from "./modules/urls/urls.controller.js";
import { asyncHandler } from "./lib/async.js";
import { shortUrlParamSchema } from "./modules/urls/urls.schema.js";
import { errorHandler, routeNotFound, validate } from "./lib/middlewares.js";

const app: Express = express();

app.use(express.json());
app.use(morgan("tiny"));

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/urls", urlRouter);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get(
  "/:shortUrl",
  validate("params", shortUrlParamSchema),
  asyncHandler(getLongUrl),
);

app.use(routeNotFound);
app.use(errorHandler);

export { app };
