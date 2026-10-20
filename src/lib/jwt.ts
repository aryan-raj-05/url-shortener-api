import jwt from "jsonwebtoken";
import { config } from "./config.js";

export const generateToken = (userId: string) =>
  jwt.sign({ userId }, config.JWT_SECRET, { expiresIn: "6h" });

export const decodeToken = (token: string) =>
  jwt.verify(token, config.JWT_SECRET);
