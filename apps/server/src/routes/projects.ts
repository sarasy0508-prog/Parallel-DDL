import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { StepSize, ProjectStatus } from '@parallel-ddl/shared';
import { getDB } from '../db/index.js';
import { AppError, ok } from '../middleware/error.js';
import { deriveStatus } from '../services/status.js';

const projects = new Hono();

const CreateProjectInput = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  ddl: z.string().datetime(),
  stepSize: StepSize,
});

const PatchProjectInput = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  ddl: z.string().datetime().optional(),
  order: z.number().int().nonnegative().optional(),
  status: ProjectStatus.optional(),
});

const ReorderInput = z.object({
  orderedIds: z.array(z.string().min(1)),
});

projects.get('/api/projects', async (c) => {
  const db = getDB();
  await db.read();
  return ok(c, db.data.projects.map((p) => deriveStatus(p)));
});

projects.post(
  '/api/projects',
  zValidator('json', CreateProjectInput, (result, c) => {
    if (!result.success) {
      return c.json(
        { ok: false, error: 'VALIDATION_ERROR', issues: result.error.issues },
        400,
      );
    }
  }),
  async (c) => {
    const db = getDB();
    const input = c.req.valid('json');

    const maxOrder = db.data.projects.reduce((max, p) => Math.max(max, p.order), -1);
    const project = {
      id: `p_${nanoid(10)}`,
      title: input.title,
      description: input.description ?? '',
      ddl: input.ddl,
      createdAt: new Date().toISOString(),
      status: 'draft' as const,
      order: maxOrder + 1,
      stepSize: input.stepSize,
      steps: [],
    };

    db.data.projects.push(project);
    await db.write();
    return ok(c, project);
  },
);

projects.patch(
  '/api/projects/:id',
  zValidator('json', PatchProjectInput, (result, c) => {
    if (!result.success) {
      return c.json(
        { ok: false, error: 'VALIDATION_ERROR', issues: result.error.issues },
        400,
      );
    }
  }),
  async (c) => {
    const db = getDB();
    const id = c.req.param('id');
    const project = db.data.projects.find((p) => p.id === id);
    if (!project) throw new AppError('NOT_FOUND', `Project ${id} not found`);

    const input = c.req.valid('json');
    if (input.title !== undefined) project.title = input.title;
    if (input.description !== undefined) project.description = input.description;
    if (input.ddl !== undefined) project.ddl = input.ddl;
    if (input.order !== undefined) project.order = input.order;
    if (input.status !== undefined) project.status = input.status;

    await db.write();
    return ok(c, project);
  },
);

projects.delete('/api/projects/:id', async (c) => {
  const db = getDB();
  const id = c.req.param('id');
  const idx = db.data.projects.findIndex((p) => p.id === id);
  if (idx === -1) throw new AppError('NOT_FOUND', `Project ${id} not found`);

  db.data.projects.splice(idx, 1);
  await db.write();
  return ok(c, { id });
});

projects.post('/api/projects/:id/archive', async (c) => {
  const db = getDB();
  const id = c.req.param('id');
  const project = db.data.projects.find((p) => p.id === id);
  if (!project) throw new AppError('NOT_FOUND', `Project ${id} not found`);
  if (project.status !== 'completed') {
    throw new AppError('VALIDATION_ERROR', '仅已完成任务可归档');
  }
  project.status = 'archived';
  await db.write();
  return ok(c, project);
});

projects.post('/api/projects/:id/unarchive', async (c) => {
  const db = getDB();
  const id = c.req.param('id');
  const project = db.data.projects.find((p) => p.id === id);
  if (!project) throw new AppError('NOT_FOUND', `Project ${id} not found`);
  if (project.status !== 'archived') {
    throw new AppError('VALIDATION_ERROR', '仅已归档任务可取消归档');
  }
  project.status = 'completed';
  await db.write();
  return ok(c, project);
});

projects.post(
  '/api/projects/reorder',
  zValidator('json', ReorderInput, (result, c) => {
    if (!result.success) {
      return c.json(
        { ok: false, error: 'VALIDATION_ERROR', issues: result.error.issues },
        400,
      );
    }
  }),
  async (c) => {
    const db = getDB();
    const { orderedIds } = c.req.valid('json');

    for (let i = 0; i < orderedIds.length; i++) {
      const project = db.data.projects.find((p) => p.id === orderedIds[i]);
      if (project) project.order = i;
    }

    await db.write();
    return ok(c, { orderedIds });
  },
);

export default projects;
