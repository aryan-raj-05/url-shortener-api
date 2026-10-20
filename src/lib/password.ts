import bcrypt from "bcrypt";

const saltRounds = 10;

export const hashPassword = (password: string) =>
  bcrypt.hash(password, saltRounds);

export const comparePassword = (password: string, passwordHash: string) =>
  bcrypt.compare(password, passwordHash);
