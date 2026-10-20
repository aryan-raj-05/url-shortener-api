import express, { type Express } from "express";
import morgan from "morgan";

const app: Express = express();

app.use(express.json());
app.use(morgan("tiny"));

app.get("/", (req, res) => {
  res.send("Hello");
});

export { app };
