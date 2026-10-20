import z from "zod";
import { url } from "../../db/schema.js";

export const shortUrlParamSchema = z.object({
  shortUrl: z.string().min(1),
});

export type ShortUrlParam = z.infer<typeof shortUrlParamSchema>;

export const createShortUrlBodySchema = z.object({
  longUrl: z.string().min(1),
  expiresAt: z.coerce
    .date()
    .refine((date) => date > new Date(), {
      message: "Expiration date must be in the future",
    })
    .optional(),
});

export type CreateShortUrlBody = z.infer<typeof createShortUrlBodySchema>;

export const toUrlResponseDto = (created: typeof url.$inferSelect) => {
  return {
    shortUrl: created.shortUrl,
    longUrl: created.longUrl,
    expiresAt: created.expiresAt,
  };
};

export type UrlResponseDto = ReturnType<typeof toUrlResponseDto>;
