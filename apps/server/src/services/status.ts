import type { ProjectType, DerivedStatusType } from '@parallel-ddl/shared';

export type ProjectWithDerivedStatus = Omit<ProjectType, 'status'> & {
  status: DerivedStatusType;
};

export function deriveStatus(
  project: ProjectType,
  now: Date = new Date(),
): ProjectWithDerivedStatus {
  let status: DerivedStatusType = project.status;

  if (project.status === 'archived') {
    status = 'archived';
  } else if (project.steps.length > 0 && project.steps.every((s) => s.done)) {
    status = 'completed';
  } else if (
    project.status !== 'completed' &&
    new Date(project.ddl).getTime() < now.getTime()
  ) {
    status = 'overdue';
  }

  return { ...project, status };
}
