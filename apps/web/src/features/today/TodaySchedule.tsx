import { useMemo } from 'react';
import { format } from 'date-fns';
import { useStore } from '../../store';

interface TodayScheduleProps {
  selectedDate: Date | null;
}

interface ScheduleItem {
  projectTitle: string;
  stepContent: string;
}

const SLOTS = [
  { key: 'morning', label: '早上' },
  { key: 'noon', label: '下午' },
  { key: 'evening', label: '晚上' },
] as const;

export function TodaySchedule({ selectedDate }: TodayScheduleProps) {
  const projects = useStore((s) => s.projects);

  const dateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;
  const dateDisplay = selectedDate ? format(selectedDate, 'M 月 d 日') : '未选择日期';

  const slotData = useMemo(() => {
    if (!dateStr) return SLOTS.map((s) => ({ ...s, items: [] as ScheduleItem[] }));

    return SLOTS.map((slot) => {
      const items: ScheduleItem[] = [];
      for (const p of projects) {
        for (const step of p.steps) {
          for (const sch of step.schedules) {
            if (sch.date === dateStr && sch.slot === slot.key) {
              items.push({ projectTitle: p.title, stepContent: step.content });
            }
          }
        }
      }
      return { ...slot, items };
    });
  }, [projects, dateStr]);

  return (
    <div className="col-span-7 bg-white rounded-2xl p-4 shadow-sm border border-stone-100 flex flex-col min-h-0">
      <div className="flex justify-between items-center mb-3 shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-stone-400 rounded-full" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400">05 / 当日安排</h3>
        </div>
        <span className="text-[10px] italic text-stone-400">{dateDisplay} · 仅展示</span>
      </div>
      <div className="space-y-2 soft-scroll overflow-y-auto flex-1 min-h-0">
        {slotData.map((slot) => (
          <div key={slot.key} className="flex items-start gap-3 p-1.5 hover:bg-stone-50 rounded-lg transition">
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
