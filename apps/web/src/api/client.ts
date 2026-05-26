import type { ProjectType, DerivedStatusType } from '@parallel-ddl/shared';

export type ProjectWithDerivedStatus = Omit<ProjectType, 'status'> & {
  status: DerivedStatusType;
};

interface ApiResponse<T> {
  ok: boolean;
  data: T;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init);
  const json: ApiResponse<T> = await res.json();
  if (!json.ok) throw new Error('API error');
  return json.data;
}

export const api = {
  projects: {
    list: () => apiFetch<ProjectWithDerivedStatus[]>('/api/projects'),
  },
};
