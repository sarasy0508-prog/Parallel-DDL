import { describe, it, expect } from 'vitest';
import { deriveStatus } from '../services/status.js';
import type { ProjectType } from '@parallel-ddl/shared';

function makeProject(overrides: Partial<ProjectType> = {}): ProjectType {
  return {
    id: 'p_test',
    title: 'Test',
    description: '',
    ddl: '2026-06-01T23:59:59.000Z',
    createdAt: '2026-05-20T00:00:00.000Z',
    status: 'in_progress',
    order: 0,
    stepSize: '25min',
    steps: [
      { id: 's_1', content: 'step1', done: false, order: 0, schedules: [] },
    ],
    ...overrides,
  };
}

describe('deriveStatus', () => {
  const beforeDdl = new Date('2026-05-25T00:00:00.000Z');
  const afterDdl = new Date('2026-06-02T00:00:00.000Z');

  it('in_progress + not overdue → in_progress', () => {
    const result = deriveStatus(makeProject(), beforeDdl);
    expect(result.status).toBe('in_progress');
  });

  it('in_progress + past ddl → overdue', () => {
    const result = deriveStatus(makeProject(), afterDdl);
    expect(result.status).toBe('overdue');
  });

  it('all steps done + past ddl → completed (overrides overdue)', () => {
    const project = makeProject({
      steps: [{ id: 's_1', content: 'step1', done: true, order: 0, schedules: [] }],
    });
    const result = deriveStatus(project, afterDdl);
    expect(result.status).toBe('completed');
  });

  it('archived + past ddl → archived (highest priority)', () => {
    const project = makeProject({ status: 'archived' });
    const result = deriveStatus(project, afterDdl);
    expect(result.status).toBe('archived');
  });

  it('draft + past ddl → overdue', () => {
    const project = makeProject({ status: 'draft' });
    const result = deriveStatus(project, afterDdl);
    expect(result.status).toBe('overdue');
  });

  it('completed (stored) + not all done → keeps completed from store', () => {
    const project = makeProject({ status: 'completed' });
    const result = deriveStatus(project, beforeDdl);
    expect(result.status).toBe('completed');
  });
});
