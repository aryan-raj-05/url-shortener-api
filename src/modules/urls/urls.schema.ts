import z from "zod";
import { url } from "../../db/schema.js";

export const shortUrlParamSchema = z.object({
  shortUrl: z.string().min(1),
});

export const createShortUrlBodySchema = z.object({
  longUrl: z.string().min(1),
  expiresAt: z.coerce
    .date()
    .refine((date) => date > new Date(), {
      message: "Expiration date must be in the future",
    })
    .optional(),
});

export const updateShortUrlBodySchema = z.object({
  newLongUrl: z.string().min(1),
  expiresAt: z.coerce
    .date()
    .refine((date) => date > new Date(), {
      message: "Expiration date must be in the future",
    })
    .optional(),
});

export const getAllUrlsQuerySchema = z.object({
  page: z.number().default(1),
  limit: z.number().default(20),
});

export type ShortUrlParam = z.infer<typeof shortUrlParamSchema>;
export type CreateShortUrlBody = z.infer<typeof createShortUrlBodySchema>;
export type UpdateShortUrlBody = z.infer<typeof updateShortUrlBodySchema>;
export type GetAllUrlsQuery = z.infer<typeof getAllUrlsQuerySchema>;

export const toUrlResponseDto = (created: typeof url.$inferSelect) => {
  return {
    shortUrl: created.shortUrl,
    longUrl: created.longUrl,
    expiresAt: created.expiresAt,
    createdAt: created.createdAt,
    updatedAt: created.updatedAt,
  };
};

export type UrlResponseDto = ReturnType<typeof toUrlResponseDto>;
export type PaginatedUrlResponseDto = {
  data: UrlResponseDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
