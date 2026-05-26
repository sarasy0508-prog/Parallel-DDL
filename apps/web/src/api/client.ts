import type { ProjectType, DerivedStatusType } from '@parallel-ddl/shared';

export type ProjectWithDerivedStatus = Omit<ProjectType, 'status'> & {
  status: DerivedStatusType;
};

interface ApiResponse<T> {
  ok: boolean;
  data: T;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  const json: ApiResponse<T> = await res.json();
  if (!json.ok) throw new Error('API error');
  return json.data;
}

export const api = {
  projects: {
    list: () => apiFetch<ProjectWithDerivedStatus[]>('/api/projects'),
    create: (body: { title: string; description?: string; ddl: string; stepSize: string }) =>
      apiFetch<ProjectWithDerivedStatus>('/api/projects', { method: 'POST', body: JSON.stringify(body) }),
    patch: (id: string, body: Record<string, unknown>) =>
      apiFetch<ProjectWithDerivedStatus>(`/api/projects/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (id: string) =>
      apiFetch<{ id: string }>(`/api/projects/${id}`, { method: 'DELETE' }),
    archive: (id: string) =>
      apiFetch<ProjectWithDerivedStatus>(`/api/projects/${id}/archive`, { method: 'POST' }),
    unarchive: (id: string) =>
      apiFetch<ProjectWithDerivedStatus>(`/api/projects/${id}/unarchive`, { method: 'POST' }),
    reorder: (orderedIds: string[]) =>
      apiFetch<{ orderedIds: string[] }>('/api/projects/reorder', { method: 'POST', body: JSON.stringify({ orderedIds }) }),
  },
  steps: {
    create: (projectId: string, body: { content: string }) =>
      apiFetch<ProjectType['steps'][number]>(`/api/projects/${projectId}/steps`, { method: 'POST', body: JSON.stringify(body) }),
    patch: (id: string, body: Record<string, unknown>) =>
      apiFetch<ProjectType['steps'][number]>(`/api/steps/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (id: string) =>
      apiFetch<{ id: string }>(`/api/steps/${id}`, { method: 'DELETE' }),
    reorder: (projectId: string, orderedIds: string[]) =>
      apiFetch<{ orderedIds: string[] }>('/api/steps/reorder', { method: 'POST', body: JSON.stringify({ projectId, orderedIds }) }),
  },
};
