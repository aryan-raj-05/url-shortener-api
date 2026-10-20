import express, { type Express } from "express";
import morgan from "morgan";
import { authRouter } from "./modules/auth/auth.route.js";
import { routeNotFound } from "./lib/middlewares.js";

const app: Express = express();

app.use(express.json());

app.use(morgan("tiny"));

app.use("/api/v1/auth", authRouter);

app.get("/", (req, res) => {
  res.send("Hello");
});

app.use(routeNotFound);

export { app };
