import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { getDB } from '../db/index.js';
import { AppError, ok } from '../middleware/error.js';

const debug = new Hono();

debug.get('/api/health', (c) => {
  return ok(c, { ts: new Date().toISOString() });
});

debug.get('/api/_debug/db', (c) => {
  const db = getDB();
  return ok(c, db.data);
});

debug.get('/api/_debug/throw', (c) => {
  const code = c.req.query('code') ?? 'INTERNAL';
  throw new AppError(code, `Debug error: ${code}`);
});

debug.post(
  '/api/_debug/validate',
  zValidator('json', z.object({ name: z.string().min(1) }), (result, c) => {
    if (!result.success) {
      return c.json(
        { ok: false, error: 'VALIDATION_ERROR', issues: result.error.issues },
        400,
      );
    }
  }),
  (c) => {
    return ok(c, { received: c.req.valid('json') });
  },
);

export default debug;
