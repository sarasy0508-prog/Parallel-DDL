import { useState } from 'react';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Skeleton } from '../../components/Skeleton';
import { StepRow } from './StepRow';
import { useStore } from '../../store';

type CardStatus = 'in_progress' | 'completed' | 'overdue' | 'loading';

interface Step {
  id: string;
  content: string;
  done: boolean;
  hasSchedule?: boolean;
}

interface BoardCardProps {
  projectId: string;
  title: string;
  description: string;
  status: CardStatus;
  deadline: string;
  steps: Step[];
  isDragging?: boolean;
}

export function BoardCard({ projectId, title, description, status, deadline, steps, isDragging }: BoardCardProps) {
  const { toggleStep, addStep, deleteStep, updateStepContent, deleteProject, archiveProject, patchProject, reorderSteps } = useStore();
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: projectId });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const [addingStep, setAddingStep] = useState(false);
  const [newStepContent, setNewStepContent] = useState('');
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [editDesc, setEditDesc] = useState(description);

  const doneCount = steps.filter((s) => s.done).length;
  const totalCount = steps.length;
  const progress = totalCount > 0 ? (doneCount / totalCount) * 100 : 0;

  const isOverdue = status === 'overdue';
  const isCompleted = status === 'completed';
  const isLoading = status === 'loading';

  const bgClass = isOverdue
    ? 'bg-red-50/40 border-red-200/60'
    : 'bg-[#F6F5F0] border-stone-200/50';

  function handleAddStep() {
    const trimmed = newStepContent.trim();
    if (trimmed) {
      addStep(projectId, trimmed);
      setNewStepContent('');
      setAddingStep(false);
    }
  }

  return (
    <div ref={setNodeRef} style={style} className={`board-card group relative p-4 rounded-xl border flex flex-col min-h-[300px] ${bgClass}`}>
      {/* Card actions (hover) */}
      {!isLoading && (
        <div className="card-actions opacity-0 group-hover:opacity-100 absolute top-2.5 right-2.5 flex items-center gap-1 transition-opacity">
          <button {...attributes} {...listeners} className="text-stone-400 hover:text-stone-700 p-0.5 rounded transition cursor-grab" title="拖拽重排">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="9" cy="6" r="1.2" /><circle cx="15" cy="6" r="1.2" />
              <circle cx="9" cy="12" r="1.2" /><circle cx="15" cy="12" r="1.2" />
              <circle cx="9" cy="18" r="1.2" /><circle cx="15" cy="18" r="1.2" />
            </svg>
          </button>
          <button
            onClick={() => { setEditTitle(title); setEditDesc(description); setEditing(true); }}
            className="text-stone-400 hover:text-stone-700 p-0.5 rounded transition"
            title="编辑"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button
            onClick={() => deleteProject(projectId)}
            className="text-stone-400 hover:text-red-500 p-0.5 rounded transition"
            title="删除"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <div className="absolute inset-0 bg-white/95 rounded-xl z-10 p-4 flex flex-col gap-3">
          <input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="text-sm font-semibold border border-stone-200 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-mocha"
            placeholder="任务名称"
          />
          <textarea
            value={editDesc}
            onChange={(e) => setEditDesc(e.target.value)}
            className="text-xs border border-stone-200 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-mocha resize-none flex-1"
            placeholder="任务描述"
          />
          <div className="flex gap-2">
            <button
              onClick={() => {
                patchProject(projectId, { title: editTitle, description: editDesc });
                setEditing(false);
              }}
              className="flex-1 bg-ink-muted text-cream-50 text-xs py-1.5 rounded-md"
            >
              保存
            </button>
            <button
              onClick={() => setEditing(false)}
              className="flex-1 border border-stone-300 text-stone-600 text-xs py-1.5 rounded-md"
            >
              取消
            </button>
          </div>
        </div>
      )}

      <div className="flex-1">
        {/* Status badge + deadline */}
        <div className="flex justify-between items-center mb-1.5 pr-16">
          {isOverdue && (
            <span className="text-[10px] tracking-wider uppercase text-red-600 font-medium">⚠ 已逾期</span>
          )}
          {status === 'in_progress' && (
            <span className="text-[10px] tracking-wider uppercase text-emerald-700 font-medium">· 进行中</span>
          )}
          {isCompleted && (
            <span className="text-[10px] tracking-wider uppercase text-stone-500 font-medium">✓ 已完成</span>
          )}
          {isLoading && (
            <span className="text-[10px] tracking-wider uppercase text-mocha font-medium animate-pulse">· AI 拆解中</span>
          )}
          <span className={`text-[11px] ${isOverdue ? 'text-red-500 font-medium' : 'text-mocha'}`}>
            {deadline}
          </span>
        </div>

        {/* Title + description */}
        <h3 className={`font-semibold text-sm ${
          isOverdue ? 'text-red-700' : isCompleted ? 'text-stone-500 line-through' : 'text-stone-800'
        }`}>
          {isOverdue && '⚠️ '}{title}
        </h3>
        <p className={`text-[11px] mt-0.5 mb-3 ${
          isOverdue ? 'text-red-400/80' : isCompleted ? 'text-stone-400 line-through' : 'text-stone-400'
        }`}>
          {description}
        </p>

        {/* Steps or skeleton */}
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-4/6" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        ) : (
          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={(event: DragEndEvent) => {
              const { active, over } = event;
              if (!over || active.id === over.id) return;
              const ids = steps.map((s) => s.id);
              const oldIdx = ids.indexOf(active.id as string);
              const newIdx = ids.indexOf(over.id as string);
              if (oldIdx === -1 || newIdx === -1) return;
              const newIds = [...ids];
              newIds.splice(oldIdx, 1);
              newIds.splice(newIdx, 0, active.id as string);
              reorderSteps(projectId, newIds);
            }}
          >
          <SortableContext items={steps.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className={`space-y-1 ${isDragging ? 'pointer-events-none' : ''}`}>
            {steps.map((step) => (
              <StepRow
                key={step.id}
                id={step.id}
                content={step.content}
                done={step.done}
                isOverdue={isOverdue}
                hasSchedule={step.hasSchedule}
                onToggle={(done) => toggleStep(projectId, step.id, done)}
                onDelete={() => deleteStep(projectId, step.id)}
                onUpdateContent={(content) => updateStepContent(step.id, content)}
              />
            ))}
            {!isCompleted && (
              addingStep ? (
                <div className="flex items-center gap-1 mt-1.5">
                  <input
                    autoFocus
                    value={newStepContent}
                    onChange={(e) => setNewStepContent(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddStep();
                      if (e.key === 'Escape') { setAddingStep(false); setNewStepContent(''); }
                    }}
                    onBlur={handleAddStep}
                    placeholder="步骤内容..."
                    className="flex-1 text-xs bg-white border border-mocha/40 rounded px-2 py-1 outline-none"
                  />
                </div>
              ) : (
                <button
                  onClick={() => setAddingStep(true)}
                  className="w-full mt-1.5 text-[11px] text-stone-400 hover:text-stone-600 italic py-1 border border-dashed border-stone-300 rounded-md transition"
                >
                  + 添加步骤
                </button>
              )
            )}
          </div>
          </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Footer */}
      {isLoading ? (
        <div className="mt-3 flex items-center gap-2 text-[11px] text-stone-400 italic">
          <svg className="animate-spin" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
            <path d="M12 2a10 10 0 0 1 10 10" />
          </svg>
          DeepSeek 正在为你温柔地拆解...
        </div>
      ) : (
        <div className={`mt-3 pt-2 border-t ${isOverdue ? 'border-red-200/40' : 'border-stone-200/40'} space-y-1.5`}>
          <div className={`flex justify-between text-[11px] ${isOverdue ? 'text-red-400' : 'text-stone-400'} mb-1`}>
            <span>进度</span>
            <span>{doneCount} / {totalCount} 已完成</span>
          </div>
          <div className={`w-full h-1 rounded-full overflow-hidden ${isOverdue ? 'bg-red-100' : 'bg-stone-200'}`}>
            <div
              className={`h-full ${isOverdue ? 'bg-red-400' : 'bg-mocha'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          {isCompleted && (
            <button
              onClick={() => archiveProject(projectId)}
              className="w-full bg-cream-50 hover:bg-stone-100 border border-stone-300/70 text-stone-600 text-[11px] font-medium py-1.5 rounded-md tracking-wider transition flex items-center justify-center gap-1.5"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4" />
              </svg>
              归档此任务
            </button>
          )}
        </div>
      )}
    </div>
  );
}
