interface ScheduleItem {
  projectTitle: string;
  stepContent: string;
}

interface TimeSlotData {
  label: string;
  items: ScheduleItem[];
}

const MOCK_SLOTS: TimeSlotData[] = [
  {
    label: '早上',
    items: [
      { projectTitle: '算法模块功能优化', stepContent: '搭建本地基准测试环境' },
      { projectTitle: '期末复习计划', stepContent: '看完线性代数第四章笔记' },
    ],
  },
  {
    label: '下午',
    items: [
      { projectTitle: '算法模块功能优化', stepContent: '完成数据源预处理代码性能重构' },
    ],
  },
  {
    label: '晚上',
    items: [],
  },
];

export function TodaySchedule() {
  return (
    <div className="col-span-7 bg-white rounded-2xl p-4 shadow-sm border border-stone-100 flex flex-col min-h-0">
      <div className="flex justify-between items-center mb-3 shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-stone-400 rounded-full" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400">05 / 当日安排</h3>
        </div>
        <span className="text-[10px] italic text-stone-400">5 月 13 日 · 仅展示</span>
      </div>
      <div className="space-y-2 soft-scroll overflow-y-auto flex-1 min-h-0">
        {MOCK_SLOTS.map((slot) => (
          <div key={slot.label} className="flex items-start gap-3 p-1.5 hover:bg-stone-50 rounded-lg transition">
            <span className="text-[11px] tracking-wide text-stone-500 w-10 mt-1 font-medium">
              {slot.label}
            </span>
            <div className="flex-1 space-y-1">
              {slot.items.length > 0 ? (
                slot.items.map((item, i) => (
                  <div key={i} className="bg-stone-50 border border-stone-100 rounded-lg px-2.5 py-1">
                    <span className="text-[9px] text-mocha">{item.projectTitle}</span>
                    <p className="text-xs text-stone-700">{item.stepContent}</p>
                  </div>
                ))
              ) : (
                <div className="border border-dashed border-stone-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-400 italic text-center">
                  暂无规划 · 自由呼吸时间
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
