import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { Schedule } from '@parallel-ddl/shared';
import { getDB } from '../db/index.js';
import { AppError, ok } from '../middleware/error.js';

const steps = new Hono();

const CreateStepInput = z.object({
  content: z.string().min(1).max(200),
});

const PatchStepInput = z.object({
  content: z.string().min(1).max(200).optional(),
  done: z.boolean().optional(),
  schedules: z.array(Schedule).optional(),
});

const ReorderStepsInput = z.object({
  projectId: z.string().min(1),
  orderedIds: z.array(z.string().min(1)),
});

steps.post(
  '/api/projects/:id/steps',
  zValidator('json', CreateStepInput, (result, c) => {
    if (!result.success) {
      return c.json(
        { ok: false, error: 'VALIDATION_ERROR', issues: result.error.issues },
        400,
      );
    }
  }),
  async (c) => {
    const db = getDB();
    const projectId = c.req.param('id');
    const project = db.data.projects.find((p) => p.id === projectId);
    if (!project) throw new AppError('NOT_FOUND', `Project ${projectId} not found`);

    const input = c.req.valid('json');
    const maxOrder = project.steps.reduce((max, s) => Math.max(max, s.order), -1);

    const step = {
      id: `s_${nanoid(10)}`,
      content: input.content,
      done: false,
      order: maxOrder + 1,
      schedules: [],
    };

    project.steps.push(step);
    await db.write();
    return ok(c, step);
  },
);

steps.patch(
  '/api/steps/:id',
  zValidator('json', PatchStepInput, (result, c) => {
    if (!result.success) {
      return c.json(
        { ok: false, error: 'VALIDATION_ERROR', issues: result.error.issues },
        400,
      );
    }
  }),
  async (c) => {
    const db = getDB();
    const stepId = c.req.param('id');

    let foundStep: (typeof db.data.projects)[number]['steps'][number] | undefined;
    for (const project of db.data.projects) {
      foundStep = project.steps.find((s) => s.id === stepId);
      if (foundStep) break;
    }
    if (!foundStep) throw new AppError('NOT_FOUND', `Step ${stepId} not found`);

    const input = c.req.valid('json');
    if (input.content !== undefined) foundStep.content = input.content;
    if (input.done !== undefined) foundStep.done = input.done;
    if (input.schedules !== undefined) foundStep.schedules = input.schedules;

    // Status linkage: all steps done → completed; any undone → in_progress
    if (input.done !== undefined) {
      for (const project of db.data.projects) {
        if (!project.steps.some((s) => s.id === stepId)) continue;
        if (project.steps.length === 0) break;
        const allDone = project.steps.every((s) => s.done);
        if (allDone && project.status === 'in_progress') {
          project.status = 'completed';
        } else if (!allDone && project.status === 'completed') {
          project.status = 'in_progress';
        }
        break;
      }
    }

    await db.write();
    return ok(c, foundStep);
  },
);

steps.delete('/api/steps/:id', async (c) => {
  const db = getDB();
  const stepId = c.req.param('id');

  for (const project of db.data.projects) {
    const idx = project.steps.findIndex((s) => s.id === stepId);
    if (idx !== -1) {
      project.steps.splice(idx, 1);
      await db.write();
      return ok(c, { id: stepId });
    }
  }
  throw new AppError('NOT_FOUND', `Step ${stepId} not found`);
});

steps.post(
  '/api/steps/reorder',
  zValidator('json', ReorderStepsInput, (result, c) => {
    if (!result.success) {
      return c.json(
        { ok: false, error: 'VALIDATION_ERROR', issues: result.error.issues },
        400,
      );
    }
  }),
  async (c) => {
    const db = getDB();
    const { projectId, orderedIds } = c.req.valid('json');
    const project = db.data.projects.find((p) => p.id === projectId);
    if (!project) throw new AppError('NOT_FOUND', `Project ${projectId} not found`);

    for (let i = 0; i < orderedIds.length; i++) {
      const step = project.steps.find((s) => s.id === orderedIds[i]);
      if (step) step.order = i;
    }

    await db.write();
    return ok(c, { orderedIds });
  },
);

export default steps;
