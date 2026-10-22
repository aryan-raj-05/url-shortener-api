import { db } from "../../db/index.js";
import { generateShortCode } from "../../lib/short-code.js";
import { type RequestHandler } from "express";
import { url, urlSelectSchema } from "../../db/schema.js";
import { deleteCached, getCached, setCached } from "../../lib/redis.js";
import { and, count, desc, eq } from "drizzle-orm";
import { GoneError, HttpError, NotFoundError } from "../../lib/errors.js";
import {
  toUrlResponseDto,
  type CreateShortUrlBody,
  type GetAllUrlsQuery,
  type PaginatedUrlResponseDto,
  type ShortUrlParam,
  type UpdateShortUrlBody,
  type UrlResponseDto,
} from "./urls.schema.js";

export const getLongUrl: RequestHandler<ShortUrlParam> = async (req, res) => {
  const { shortUrl } = req.params;
  const cacheKey = `url:${shortUrl}`;

  const cachedUrl = await getCached(cacheKey, urlSelectSchema);

  if (cachedUrl) {
    if (cachedUrl.expiresAt && cachedUrl.expiresAt < new Date()) {
      throw new GoneError("Short URL has expired");
    }
    return res.redirect(302, cachedUrl.longUrl);
  }

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

  await setCached(cacheKey, resolvedLongUrl, urlSelectSchema, 300);

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

export const getAllUrlsCreatedByUser: RequestHandler<
  {},
  UrlResponseDto[]
> = async (req, res) => {
  const { userId } = req.user!;

  const selected = await db
    .select()
    .from(url)
    .where(eq(url.createdBy, userId))
    .orderBy(desc(url.createdAt));

  const urls = selected.map((u) => toUrlResponseDto(u));

  res.status(200).json(urls);
};

export const updateShortUrl: RequestHandler<
  ShortUrlParam,
  UrlResponseDto,
  UpdateShortUrlBody
> = async (req, res) => {
  const { shortUrl } = req.params;
  const { newLongUrl, expiresAt } = req.body;
  const { userId } = req.user!;

  const [updated] = await db
    .update(url)
    .set({
      longUrl: newLongUrl,
      expiresAt: expiresAt ?? null,
    })
    .where(and(eq(url.createdBy, userId), eq(url.shortUrl, shortUrl)))
    .returning();

  if (!updated) {
    throw new NotFoundError();
  }

  await deleteCached(`url:${shortUrl}`);

  return res.status(200).json(toUrlResponseDto(updated));
};

export const deleteShortUrl: RequestHandler<ShortUrlParam> = async (
  req,
  res,
) => {
  const { shortUrl } = req.params;
  const { userId } = req.user!;

  const [deleted] = await db
    .delete(url)
    .where(and(eq(url.shortUrl, shortUrl), eq(url.createdBy, userId)))
    .returning();

  if (!deleted) {
    throw new NotFoundError();
  }

  await deleteCached(`url:${shortUrl}`);

  res.sendStatus(204);
};
