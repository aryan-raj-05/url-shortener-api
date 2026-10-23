import { Router } from "express";
import { signInUser, signUpUser } from "./auth.controller.js";
import { asyncHandler } from "../../lib/async.js";

const authRouter: Router = Router();

authRouter
  .post("/sign-in", asyncHandler(signInUser))
  .post("/sign-up", asyncHandler(signUpUser));

export { authRouter };
