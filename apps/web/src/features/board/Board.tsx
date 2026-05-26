import { useState } from 'react';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { BoardCard } from './BoardCard';
import { useStore } from '../../store';
import type { DerivedStatusType } from '@parallel-ddl/shared';

function formatDeadline(ddl: string, status: DerivedStatusType): string {
  if (status === 'completed') return '温柔抵达';
  const now = new Date();
  const deadline = new Date(ddl);
  const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return `已过期 ${Math.abs(diffDays)} 天`;
  if (diffDays === 0) return '今天截止';
  return `${diffDays} 天后截止`;
}

function mapStatus(status: DerivedStatusType): 'in_progress' | 'completed' | 'overdue' | 'loading' {
  if (status === 'draft') return 'loading';
  if (status === 'overdue') return 'overdue';
  if (status === 'completed') return 'completed';
  return 'in_progress';
}

export function Board() {
  const projects = useStore((s) => s.projects);
  const reorderProjects = useStore((s) => s.reorderProjects);
  const [isDragging, setIsDragging] = useState(false);

  const visibleProjects = projects.filter((p) => p.status !== 'archived');

  function handleDragEnd(event: DragEndEvent) {
    setIsDragging(false);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const ids = visibleProjects.map((p) => p.id);
    const oldIdx = ids.indexOf(active.id as string);
    const newIdx = ids.indexOf(over.id as string);
    if (oldIdx === -1 || newIdx === -1) return;

    const newIds = [...ids];
    newIds.splice(oldIdx, 1);
    newIds.splice(newIdx, 0, active.id as string);
    reorderProjects(newIds);
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100 shrink-0 flex flex-col" style={{ height: '52%' }}>
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-emerald-700 rounded-full" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-400">
            02 / 项目看板
          </h2>
        </div>
        <span className="text-xs italic text-stone-400">
          并行进行中 · {visibleProjects.length} 个看板
        </span>
      </div>

      <DndContext
        collisionDetection={closestCenter}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={visibleProjects.map((p) => p.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 gap-4 overflow-y-auto flex-1 min-h-0 pr-1 soft-scroll">
            {visibleProjects.map((project) => (
              <BoardCard
                key={project.id}
                projectId={project.id}
                title={project.title}
                description={project.description}
                ddl={project.ddl}
                status={mapStatus(project.status)}
                deadline={formatDeadline(project.ddl, project.status)}
                steps={project.steps.map((s) => ({
                  id: s.id,
                  content: s.content,
                  done: s.done,
                  hasSchedule: s.schedules.length > 0,
                  schedules: s.schedules,
                }))}
                isDragging={isDragging}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
