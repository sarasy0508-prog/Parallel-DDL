import { create } from 'zustand';
import { api, type ProjectWithDerivedStatus } from '../api/client';
import { showToast } from '../components/Toast';

interface Store {
  projects: ProjectWithDerivedStatus[];
  loading: boolean;
  fetchAll: () => Promise<void>;
  toggleStep: (projectId: string, stepId: string, done: boolean) => Promise<void>;
  addStep: (projectId: string, content: string) => Promise<void>;
  deleteStep: (projectId: string, stepId: string) => Promise<void>;
  updateStepContent: (stepId: string, content: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  archiveProject: (id: string) => Promise<void>;
  patchProject: (id: string, data: { title?: string; description?: string; ddl?: string }) => Promise<void>;
  reorderProjects: (orderedIds: string[]) => Promise<void>;
  reorderSteps: (projectId: string, orderedIds: string[]) => Promise<void>;
  createProject: (data: { title: string; description?: string; ddl: string; stepSize: string }) => Promise<string | undefined>;
  aiBreakdown: (projectId: string, data: { title: string; description?: string; ddl: string; stepSize: string }) => Promise<string[] | undefined>;
  confirmBreakdown: (projectId: string, steps: string[]) => Promise<void>;
}

export const useStore = create<Store>((set, get) => ({
  projects: [],
  loading: true,

  fetchAll: async () => {
    set({ loading: true });
    try {
      const data = await api.projects.list();
      set({ projects: data, loading: false });
    } catch {
      showToast('加载项目失败');
      set({ loading: false });
    }
  },

  toggleStep: async (projectId, stepId, done) => {
    const prev = get().projects;
    set({
      projects: prev.map((p) =>
        p.id === projectId
          ? { ...p, steps: p.steps.map((s) => (s.id === stepId ? { ...s, done } : s)) }
          : p,
      ),
    });
    try {
      await api.steps.patch(stepId, { done });
      await get().fetchAll();
    } catch {
      set({ projects: prev });
      showToast('操作失败，已回滚');
    }
  },

  addStep: async (projectId, content) => {
    try {
      await api.steps.create(projectId, { content });
      await get().fetchAll();
    } catch {
      showToast('添加步骤失败');
    }
  },

  deleteStep: async (projectId, stepId) => {
    const prev = get().projects;
    set({
      projects: prev.map((p) =>
        p.id === projectId
          ? { ...p, steps: p.steps.filter((s) => s.id !== stepId) }
          : p,
      ),
    });
    try {
      await api.steps.delete(stepId);
    } catch {
      set({ projects: prev });
      showToast('删除失败，已回滚');
    }
  },

  updateStepContent: async (stepId, content) => {
    try {
      await api.steps.patch(stepId, { content });
      await get().fetchAll();
    } catch {
      showToast('更新失败');
    }
  },

  deleteProject: async (id) => {
    const prev = get().projects;
    set({ projects: prev.filter((p) => p.id !== id) });
    try {
      await api.projects.delete(id);
    } catch {
      set({ projects: prev });
      showToast('删除失败，已回滚');
    }
  },

  archiveProject: async (id) => {
    try {
      await api.projects.archive(id);
      await get().fetchAll();
    } catch {
      showToast('归档失败：仅已完成任务可归档');
    }
  },

  patchProject: async (id, data) => {
    try {
      await api.projects.patch(id, data);
      await get().fetchAll();
    } catch {
      showToast('更新失败');
    }
  },

  reorderProjects: async (orderedIds) => {
    const prev = get().projects;
    const reordered = orderedIds
      .map((id) => prev.find((p) => p.id === id))
      .filter(Boolean) as ProjectWithDerivedStatus[];
    const remaining = prev.filter((p) => !orderedIds.includes(p.id));
    set({ projects: [...reordered, ...remaining] });
    try {
      await api.projects.reorder(orderedIds);
    } catch {
      set({ projects: prev });
      showToast('排序失败，已回滚');
    }
  },

  createProject: async (data) => {
    try {
      const project = await api.projects.create(data);
      await get().fetchAll();
      return project.id;
    } catch {
      showToast('创建项目失败');
      return undefined;
    }
  },

  aiBreakdown: async (_projectId, data) => {
    try {
      const result = await api.ai.breakdown(data);
      return result.steps;
    } catch {
      showToast('AI 拆解失败，可手动添加步骤');
      return undefined;
    }
  },

  confirmBreakdown: async (projectId, steps) => {
    try {
      for (const content of steps) {
        await api.steps.create(projectId, { content });
      }
      await api.projects.patch(projectId, { status: 'in_progress' });
      await get().fetchAll();
    } catch {
      showToast('确认拆解失败');
    }
  },

  reorderSteps: async (projectId, orderedIds) => {
    const prev = get().projects;
    set({
      projects: prev.map((p) => {
        if (p.id !== projectId) return p;
        const reordered = orderedIds
          .map((id) => p.steps.find((s) => s.id === id))
          .filter(Boolean) as typeof p.steps;
        return { ...p, steps: reordered };
      }),
    });
    try {
      await api.steps.reorder(projectId, orderedIds);
    } catch {
      set({ projects: prev });
      showToast('排序失败，已回滚');
    }
  },
}));

export async function optimistic<T>(opts: {
  apply: () => void;
  rollback: () => void;
  request: () => Promise<T>;
}): Promise<T | undefined> {
  opts.apply();
  try {
    return await opts.request();
  } catch {
    opts.rollback();
    showToast('操作失败，已回滚');
    return undefined;
  }
}
