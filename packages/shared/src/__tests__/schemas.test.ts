import { describe, it, expect } from 'vitest';
import {
  ProjectStatus,
  DerivedStatus,
  TimeSlot,
  Schedule,
  Step,
  StepSize,
  Project,
  DBFile,
} from '../index.js';

describe('ProjectStatus', () => {
  it('accepts valid statuses', () => {
    expect(ProjectStatus.parse('draft')).toBe('draft');
    expect(ProjectStatus.parse('in_progress')).toBe('in_progress');
    expect(ProjectStatus.parse('completed')).toBe('completed');
    expect(ProjectStatus.parse('archived')).toBe('archived');
  });

  it('rejects invalid status', () => {
    expect(() => ProjectStatus.parse('overdue')).toThrow();
    expect(() => ProjectStatus.parse('')).toThrow();
  });
});

describe('DerivedStatus', () => {
  it('accepts overdue in addition to base statuses', () => {
    expect(DerivedStatus.parse('overdue')).toBe('overdue');
    expect(DerivedStatus.parse('draft')).toBe('draft');
  });

  it('rejects unknown status', () => {
    expect(() => DerivedStatus.parse('cancelled')).toThrow();
  });
});

describe('Schedule', () => {
  it('accepts valid schedule', () => {
    const result = Schedule.parse({ date: '2026-05-21', slot: 'morning' });
    expect(result).toEqual({ date: '2026-05-21', slot: 'morning' });
  });

  it('rejects invalid date format', () => {
    expect(() => Schedule.parse({ date: '2026/05/21', slot: 'morning' })).toThrow();
    expect(() => Schedule.parse({ date: '26-05-21', slot: 'morning' })).toThrow();
  });

  it('rejects invalid slot', () => {
    expect(() => Schedule.parse({ date: '2026-05-21', slot: 'afternoon' })).toThrow();
  });
});

describe('TimeSlot', () => {
  it('accepts morning, noon, evening', () => {
    expect(TimeSlot.parse('morning')).toBe('morning');
    expect(TimeSlot.parse('noon')).toBe('noon');
    expect(TimeSlot.parse('evening')).toBe('evening');
  });
});

describe('Step', () => {
  it('accepts valid step with defaults', () => {
    const result = Step.parse({ id: 's_001', content: '写测试', order: 0 });
    expect(result).toEqual({
      id: 's_001',
      content: '写测试',
      done: false,
      order: 0,
      schedules: [],
    });
  });

  it('accepts step with schedules', () => {
    const result = Step.parse({
      id: 's_002',
      content: '看文档',
      done: true,
      order: 1,
      schedules: [{ date: '2026-05-22', slot: 'evening' }],
    });
    expect(result.schedules).toHaveLength(1);
    expect(result.done).toBe(true);
  });

  it('rejects empty content', () => {
    expect(() => Step.parse({ id: 's_001', content: '', order: 0 })).toThrow();
  });

  it('rejects negative order', () => {
    expect(() => Step.parse({ id: 's_001', content: 'x', order: -1 })).toThrow();
  });
});

describe('StepSize', () => {
  it('accepts all four sizes', () => {
    expect(StepSize.parse('5min')).toBe('5min');
    expect(StepSize.parse('10min')).toBe('10min');
    expect(StepSize.parse('25min')).toBe('25min');
    expect(StepSize.parse('45min')).toBe('45min');
  });

  it('rejects invalid size', () => {
    expect(() => StepSize.parse('15min')).toThrow();
  });
});

describe('Project', () => {
  const validProject = {
    id: 'p_abc123',
    title: '期末复习',
    ddl: '2026-06-01T23:59:59.000Z',
    createdAt: '2026-05-20T08:00:00.000Z',
    status: 'in_progress' as const,
    order: 0,
    stepSize: '25min' as const,
  };

  it('accepts valid project with defaults', () => {
    const result = Project.parse(validProject);
    expect(result.description).toBe('');
    expect(result.steps).toEqual([]);
  });

  it('accepts project with all fields', () => {
    const result = Project.parse({
      ...validProject,
      description: '线性代数期末',
      steps: [{ id: 's_001', content: '第一章', order: 0 }],
    });
    expect(result.steps).toHaveLength(1);
    expect(result.description).toBe('线性代数期末');
  });

  it('rejects missing title', () => {
    const { title, ...noTitle } = validProject;
    expect(() => Project.parse(noTitle)).toThrow();
  });

  it('rejects invalid datetime format for ddl', () => {
    expect(() => Project.parse({ ...validProject, ddl: '2026-06-01' })).toThrow();
  });
});

describe('DBFile', () => {
  it('accepts valid db file', () => {
    const result = DBFile.parse({
      meta: { version: 1 },
      projects: [],
    });
    expect(result.meta.version).toBe(1);
    expect(result.projects).toEqual([]);
  });

  it('accepts db file with projects', () => {
    const result = DBFile.parse({
      meta: { version: 1 },
      projects: [{
        id: 'p_1',
        title: 'Test',
        ddl: '2026-06-01T00:00:00.000Z',
        createdAt: '2026-05-20T00:00:00.000Z',
        status: 'draft',
        order: 0,
        stepSize: '5min',
      }],
    });
    expect(result.projects).toHaveLength(1);
  });

  it('rejects missing meta', () => {
    expect(() => DBFile.parse({ projects: [] })).toThrow();
  });

  it('rejects wrong version', () => {
    expect(() => DBFile.parse({ meta: { version: 2 }, projects: [] })).toThrow();
  });
});
