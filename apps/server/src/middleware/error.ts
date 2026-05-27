import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

const HTTP_MAP: Record<string, number> = {
  NOT_FOUND: 404,
  VALIDATION_ERROR: 400,
  CONFLICT: 409,
  AI_PROVIDER_ERROR: 502,
  AI_PARSE_ERROR: 502,
};

export class AppError extends Error {
  code: string;
  http: number;

  constructor(code: string, message?: string) {
    super(message ?? code);
    this.code = code;
    this.http = HTTP_MAP[code] ?? 500;
  }
}

export function errorHandler(err: Error, c: Context) {
  if (err instanceof AppError) {
    if (!(err.code in HTTP_MAP)) {
      return c.json(
        { ok: false, error: 'INTERNAL', message: 'Internal server error' },
        500,
      );
    }
    return c.json(
      { ok: false, error: err.code, message: err.message },
      err.http as ContentfulStatusCode,
    );
  }
  if (err instanceof HTTPException && err.status === 400) {
    return c.json(
      { ok: false, error: 'VALIDATION_ERROR', message: err.message },
      400,
    );
  }
  console.error('Unhandled error:', err);
  return c.json(
    { ok: false, error: 'INTERNAL', message: 'Internal server error' },
    500,
  );
}

export function ok<T>(c: Context, data: T) {
  return c.json({ ok: true, data });
}
