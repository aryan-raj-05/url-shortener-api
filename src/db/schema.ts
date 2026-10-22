import { createSelectSchema } from "drizzle-zod";
import {
  boolean,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const user = pgTable("users", {
  id: uuid().primaryKey().defaultRandom(),

  name: varchar({ length: 255 }).notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  password: text("password").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const url = pgTable("short_urls", {
  shortUrl: text("short_url").primaryKey(),
  longUrl: text("long_url").notNull(),
  expiresAt: timestamp("expires_at"),

  createdBy: uuid("created_by")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const urlSelectSchema = createSelectSchema(url);
