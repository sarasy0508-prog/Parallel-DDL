import { z } from 'zod';
import { Project } from './project.js';

export const DBFile = z.object({
  meta: z.object({ version: z.literal(1) }),
  projects: z.array(Project).default([]),
});
export type DBFile = z.infer<typeof DBFile>;
