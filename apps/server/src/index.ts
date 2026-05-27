import 'dotenv/config';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initDB } from './db/index.js';
import { errorHandler, ok } from './middleware/error.js';
import { logger } from './middleware/logger.js';
import projects from './routes/projects.js';
import steps from './routes/steps.js';
import ai from './routes/ai.js';
import debug from './routes/debug.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = new Hono();

app.use('*', logger);
app.onError(errorHandler);

app.get('/api/health', (c) => ok(c, { ts: new Date().toISOString() }));
app.route('/', projects);
app.route('/', steps);
app.route('/', ai);

if (process.env.NODE_ENV !== 'production') {
  app.route('/', debug);
}

if (process.env.NODE_ENV === 'production') {
  const webDist = resolve(__dirname, '..', '..', 'web', 'dist');
  app.use('/assets/*', serveStatic({ root: webDist }));
  app.get('*', (c, next) => {
    if (c.req.path.startsWith('/api')) return next();
    return serveStatic({ root: webDist, path: 'index.html' })(c, next);
  });
}

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
