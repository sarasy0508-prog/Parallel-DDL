const MOCK_ARCHIVED = [
  { title: '季度财报对接', time: '5 天前' },
  { title: '云原生架构评审', time: '上周' },
  { title: '课程展示文稿准备', time: '2 周前' },
  { title: '读书笔记整理', time: '3 周前' },
];

export function ArchivedList() {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100 flex-1 flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-stone-400 rounded-full" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-400">
            03 / 已归档
          </h2>
        </div>
        <span className="text-xs italic text-stone-400">共 {MOCK_ARCHIVED.length} 个</span>
      </div>
      <div className="soft-scroll overflow-y-auto flex-1 min-h-0">
        {MOCK_ARCHIVED.map((item, i) => (
          <div
            key={item.title}
            className={`py-2 flex justify-between items-center ${
              i < MOCK_ARCHIVED.length - 1 ? 'border-b border-stone-100' : ''
            }`}
          >
            <span className="text-sm text-stone-400 font-medium line-through">{item.title}</span>
            <span className="text-[11px] text-stone-400 italic">{item.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
