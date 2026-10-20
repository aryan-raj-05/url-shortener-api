import type { RequestHandler } from "express";
import type { SignInBody, SignUpBody } from "./auth.schema.js";
import { comparePassword, hashPassword } from "../../lib/password.js";
import { generateToken } from "../../lib/jwt.js";
import { createUser, findUserByEmail } from "../user/user.repository.js";

export const signInUser: RequestHandler<{}, any, SignInBody> = async (
  req,
  res,
) => {
  const { email, password } = req.body;

  const user = await findUserByEmail(email);

  if (!user || !(await comparePassword(password, user.password))) {
    return res.status(401).json({ error: "invalid email or password" });
  }

  const token = generateToken(user.id);

  return res.status(200).json({ token });
};

export const signUpUser: RequestHandler<{}, any, SignUpBody> = async (
  req,
  res,
) => {
  const { name, email, password } = req.body;

  const passwordHash = await hashPassword(password);

  const user = await createUser(name, email, passwordHash);

  if (!user) {
    return res.status(500).json({ error: "failed to create user" });
  }

  const token = generateToken(user.id);
  return res.status(201).json({ token });
};
