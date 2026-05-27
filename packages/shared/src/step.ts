import { z } from 'zod';
import { Schedule } from './schedule.js';

export const Step = z.object({
  id: z.string().min(1),
  content: z.string().min(1).max(200),
  done: z.boolean().default(false),
  order: z.number().int().nonnegative(),
  schedules: z.array(Schedule).default([]),
});
export type Step = z.infer<typeof Step>;
