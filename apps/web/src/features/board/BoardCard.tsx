import { Skeleton } from '../../components/Skeleton';
import { StepRow } from './StepRow';

type CardStatus = 'in_progress' | 'completed' | 'overdue' | 'loading';

interface Step {
  id: string;
  content: string;
  done: boolean;
  hasSchedule?: boolean;
}

interface BoardCardProps {
  title: string;
  description: string;
  status: CardStatus;
  deadline: string;
  steps: Step[];
}

export function BoardCard({ title, description, status, deadline, steps }: BoardCardProps) {
  const doneCount = steps.filter((s) => s.done).length;
  const totalCount = steps.length;
  const progress = totalCount > 0 ? (doneCount / totalCount) * 100 : 0;

  const isOverdue = status === 'overdue';
  const isCompleted = status === 'completed';
  const isLoading = status === 'loading';

  const bgClass = isOverdue
    ? 'bg-red-50/40 border-red-200/60'
    : 'bg-[#F6F5F0] border-stone-200/50';

  return (
    <div className={`board-card group relative p-4 rounded-xl border flex flex-col min-h-[300px] ${bgClass}`}>
      {/* Card actions (hover) */}
      {!isLoading && (
        <div className="card-actions opacity-0 group-hover:opacity-100 absolute top-2.5 right-2.5 flex items-center gap-1 transition-opacity">
          <button className="text-stone-400 hover:text-stone-700 p-0.5 rounded transition" title="拖拽重排">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="9" cy="6" r="1.2" /><circle cx="15" cy="6" r="1.2" />
              <circle cx="9" cy="12" r="1.2" /><circle cx="15" cy="12" r="1.2" />
              <circle cx="9" cy="18" r="1.2" /><circle cx="15" cy="18" r="1.2" />
            </svg>
          </button>
          <button className="text-stone-400 hover:text-stone-700 p-0.5 rounded transition" title="编辑">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button className="text-stone-400 hover:text-red-500 p-0.5 rounded transition" title="删除">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
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
          <div className="space-y-1">
            {steps.map((step) => (
              <StepRow
                key={step.id}
                content={step.content}
                done={step.done}
                isOverdue={isOverdue}
                hasSchedule={step.hasSchedule}
              />
            ))}
            {!isCompleted && (
              <button className="w-full mt-1.5 text-[11px] text-stone-400 hover:text-stone-600 italic py-1 border border-dashed border-stone-300 rounded-md transition">
                + 添加步骤
              </button>
            )}
          </div>
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
            <button className="w-full bg-cream-50 hover:bg-stone-100 border border-stone-300/70 text-stone-600 text-[11px] font-medium py-1.5 rounded-md tracking-wider transition flex items-center justify-center gap-1.5">
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
