import { z } from 'zod';

export const ProjectStatus = z.enum([
  'draft',
  'in_progress',
  'completed',
  'archived',
]);
export type ProjectStatus = z.infer<typeof ProjectStatus>;

export const DerivedStatus = z.enum([
  ...ProjectStatus.options,
  'overdue',
]);
export type DerivedStatus = z.infer<typeof DerivedStatus>;
