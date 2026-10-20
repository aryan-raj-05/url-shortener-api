import { drizzle } from "drizzle-orm/node-postgres";
import { config } from "../lib/config.js";

export const db = drizzle(config.DATABASE_URL);
