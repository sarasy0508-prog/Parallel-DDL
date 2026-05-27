import { z } from 'zod';

export const TimeSlot = z.enum(['morning', 'noon', 'evening']);
export type TimeSlot = z.infer<typeof TimeSlot>;

export const Schedule = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slot: TimeSlot,
});
export type Schedule = z.infer<typeof Schedule>;
