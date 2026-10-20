import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { url } from "../../db/schema.js";
import { generateShortCode } from "../../lib/short-code.js";
import { GoneError, HttpError, NotFoundError } from "../../lib/errors.js";
import type { RequestHandler } from "express";
import {
  toUrlResponseDto,
  type CreateShortUrlBody,
  type ShortUrlParam,
  type UrlResponseDto,
} from "./urls.schema.js";

export const getLongUrl: RequestHandler<ShortUrlParam> = async (req, res) => {
  const { shortUrl } = req.params;

  const [resolvedLongUrl] = await db
    .select()
    .from(url)
    .where(eq(url.shortUrl, shortUrl));

  if (!resolvedLongUrl) {
    throw new NotFoundError();
  }

  if (resolvedLongUrl.expiresAt && resolvedLongUrl.expiresAt < new Date()) {
    throw new GoneError("Short URL has expired");
  }

  res.redirect(302, resolvedLongUrl.longUrl);
};

function isShortCodeUniqueViolation(err: unknown): boolean {
  if (typeof err !== "object" || err === null || !("cause" in err)) {
    return false;
  }

  const cause = err.cause;

  if (typeof cause !== "object" || cause === null || !("code" in cause)) {
    return false;
  }

  return cause.code === "23505";
}

export const createShortUrl: RequestHandler<
  {},
  UrlResponseDto,
  CreateShortUrlBody
> = async (req, res) => {
  const { longUrl, expiresAt } = req.body;

  for (let attempt = 0; attempt < 5; attempt++) {
    const shortUrl = generateShortCode();

    try {
      const [created] = await db
        .insert(url)
        .values({
          shortUrl,
          longUrl,
          createdBy: req.user!.userId,
          expiresAt: expiresAt ?? null,
        })
        .returning();

      return res.status(201).json(toUrlResponseDto(created!));
    } catch (error) {
      if (isShortCodeUniqueViolation(error)) {
        continue;
      }

      throw error;
    }
  }

  throw new HttpError(500, "Could not generate a unique short code");
};
