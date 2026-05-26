import { useStore } from '../../store';

export function ArchivedList() {
  const projects = useStore((s) => s.projects);
  const { archiveProject } = useStore();

  const archived = projects.filter((p) => p.status === 'archived');

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100 flex-1 flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-stone-400 rounded-full" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-400">
            03 / 已归档
          </h2>
        </div>
        <span className="text-xs italic text-stone-400">共 {archived.length} 个</span>
      </div>
      <div className="soft-scroll overflow-y-auto flex-1 min-h-0">
        {archived.length === 0 ? (
          <p className="text-xs text-stone-400 italic text-center py-4">暂无归档任务</p>
        ) : (
          archived.map((item) => (
            <ArchivedItem key={item.id} id={item.id} title={item.title} />
          ))
        )}
      </div>
    </div>
  );
}

function ArchivedItem({ id, title }: { id: string; title: string }) {
  const unarchive = useStore((s) => s.unarchiveProject);

  return (
    <div className="py-2 border-b border-stone-100 flex justify-between items-center group">
      <span className="text-sm text-stone-400 font-medium line-through">{title}</span>
      <button
        onClick={() => unarchive(id)}
        className="text-[10px] text-stone-400 hover:text-mocha opacity-0 group-hover:opacity-100 transition-opacity"
      >
        取消归档
      </button>
    </div>
  );
}
