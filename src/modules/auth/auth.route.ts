import { Router } from "express";
import { validate } from "../../lib/middlewares.js";
import { signInUser, signUpUser } from "./auth.controller.js";
import { signInBodySchema, signUpBodySchema } from "./auth.schema.js";
import { asyncHandler } from "../../lib/async.js";

const authRouter: Router = Router();

authRouter
  .post(
    "/sign-in",
    validate("body", signInBodySchema),
    asyncHandler(signInUser),
  )
  .post(
    "/sign-up",
    validate("body", signUpBodySchema),
    asyncHandler(signUpUser),
  );

export { authRouter };
