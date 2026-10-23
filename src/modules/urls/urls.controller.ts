import { db } from "../../db/index.js";
import { generateShortCode } from "../../lib/short-code.js";
import { type RequestHandler } from "express";
import { and, count, desc, eq } from "drizzle-orm";
import { url, urlSelectSchema } from "../../db/schema.js";
import { deleteCached, getCached, setCached } from "../../lib/redis.js";
import { GoneError, HttpError, NotFoundError } from "../../lib/errors.js";
import {
  createShortUrlBodySchema,
  getAllUrlsQuerySchema,
  shortUrlParamSchema,
  toUrlResponseDto,
  updateShortUrlBodySchema,
  type PaginatedUrlResponseDto,
  type UrlResponseDto,
} from "./urls.schema.js";

export const getLongUrl: RequestHandler = async (req, res) => {
  const { shortUrl } = shortUrlParamSchema.parse(req.params);
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

export const createShortUrl: RequestHandler<{}, UrlResponseDto> = async (
  req,
  res,
) => {
  const { longUrl, expiresAt } = createShortUrlBodySchema.parse(req.body);

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

export const getUrlsCreatedByUserPaginated: RequestHandler<
  {},
  PaginatedUrlResponseDto
> = async (req, res) => {
  const { userId } = req.user!;
  const { page, limit } = getAllUrlsQuerySchema.parse(req.query);

  const offset = (page - 1) * limit;

  const [selected, [countResult]] = await Promise.all([
    db
      .select()
      .from(url)
      .where(eq(url.createdBy, userId))
      .orderBy(desc(url.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(url).where(eq(url.createdBy, userId)),
  ]);

  const urls = selected.map((u) => toUrlResponseDto(u));
  const total = countResult!.total;

  res.status(200).json({
    data: urls,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
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

export const updateShortUrl: RequestHandler<{}, UrlResponseDto> = async (
  req,
  res,
) => {
  const { shortUrl } = shortUrlParamSchema.parse(req.params);
  const { newLongUrl, expiresAt } = updateShortUrlBodySchema.parse(req.body);
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

export const deleteShortUrl: RequestHandler = async (req, res) => {
  const { shortUrl } = shortUrlParamSchema.parse(req.params);
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
