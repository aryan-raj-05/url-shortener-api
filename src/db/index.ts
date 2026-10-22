import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

import { config } from "../lib/config.js";

export const pool = new Pool({
  connectionString: config.DATABASE_URL,
});

export const db = drizzle({ client: pool });
