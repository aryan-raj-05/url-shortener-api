import type { RequestHandler } from "express";
import { generateToken } from "../../lib/jwt.js";
import { createUser, findUserByEmail } from "../user/user.repository.js";
import { HttpError, UnauthorizedError } from "../../lib/errors.js";
import { comparePassword, hashPassword } from "../../lib/password.js";
import type {
  SignInResponseDto,
  SignInBody,
  SignUpBody,
} from "./auth.schema.js";

export const signInUser: RequestHandler<
  {},
  SignInResponseDto,
  SignInBody
> = async (req, res) => {
  const { email, password } = req.body;

  const user = await findUserByEmail(email);

  if (!user || !(await comparePassword(password, user.password))) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const token = generateToken(user.id);

  return res.status(200).json({ token });
};

export const signUpUser: RequestHandler<
  {},
  SignInResponseDto,
  SignUpBody
> = async (req, res) => {
  const { name, email, password } = req.body;

  const passwordHash = await hashPassword(password);

  const user = await createUser(name, email, passwordHash);

  if (!user) {
    throw new HttpError(500, "Failed to create user");
  }

  const token = generateToken(user.id);

  return res.status(201).json({ token });
};
