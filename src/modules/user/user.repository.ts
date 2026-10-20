import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { user } from "../../db/schema.js";

export const findUserByEmail = async (email: string) => {
  const [userToFind] = await db
    .select()
    .from(user)
    .where(eq(user.email, email));

  return userToFind;
};

export const createUser = async (
  name: string,
  email: string,
  passwordHash: string,
) => {
  const [newUser] = await db
    .insert(user)
    .values({
      name,
      email,
      password: passwordHash,
    })
    .returning();

  return newUser;
};
