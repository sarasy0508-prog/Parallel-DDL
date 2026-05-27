import { z } from 'zod';
import { ProjectStatus } from './status.js';
import { Step } from './step.js';

export const StepSize = z.enum(['5min', '10min', '25min', '45min']);
export type StepSize = z.infer<typeof StepSize>;

export const Project = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(100),
  description: z.string().max(500).default(''),
  ddl: z.string().datetime(),
  createdAt: z.string().datetime(),
  status: ProjectStatus,
  order: z.number().int().nonnegative(),
  stepSize: StepSize,
  steps: z.array(Step).default([]),
});
export type Project = z.infer<typeof Project>;
