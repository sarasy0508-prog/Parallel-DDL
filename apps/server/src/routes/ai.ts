import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { callDeepSeek } from '../services/deepseek.js';
import { ok } from '../middleware/error.js';

const ai = new Hono();

const BreakdownInput = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  ddl: z.string().datetime(),
  stepSize: z.enum(['5min', '10min', '25min', '45min']),
});

ai.post(
  '/api/ai/breakdown',
  zValidator('json', BreakdownInput, (result, c) => {
    if (!result.success) {
      return c.json(
        { ok: false, error: 'VALIDATION_ERROR', issues: result.error.issues },
        400,
      );
    }
  }),
  async (c) => {
    const input = c.req.valid('json');
    const steps = await callDeepSeek(input);
    return ok(c, { steps });
  },
);

export default ai;
