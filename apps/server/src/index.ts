import 'dotenv/config';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { initDB, getDB } from './db/index.js';
import { AppError, errorHandler, ok } from './middleware/error.js';
import { logger } from './middleware/logger.js';
import projects from './routes/projects.js';
import steps from './routes/steps.js';
import ai from './routes/ai.js';

const app = new Hono();

app.use('*', logger);
app.onError(errorHandler);

app.get('/api/health', (c) => {
  return ok(c, { ts: new Date().toISOString() });
});

app.get('/api/_debug/db', (c) => {
  const db = getDB();
  return ok(c, db.data);
});

app.get('/api/_debug/throw', (c) => {
  const code = c.req.query('code') ?? 'INTERNAL';
  throw new AppError(code, `Debug error: ${code}`);
});

app.post(
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

app.route('/', projects);
app.route('/', steps);
app.route('/', ai);

async function main() {
  await initDB();

  const port = 3000;
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Listening on http://127.0.0.1:${port}`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});

export type AppType = typeof app;
