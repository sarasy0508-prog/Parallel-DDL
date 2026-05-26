import { useState } from 'react';
import { format } from 'date-fns';
import { useStore } from '../../store';
import type { ScheduleType } from '@parallel-ddl/shared';

interface ScheduleModalProps {
  stepId: string;
  schedules: ScheduleType[];
  onClose: () => void;
}

const SLOTS = [
  { key: 'morning' as const, label: '早上' },
  { key: 'noon' as const, label: '下午' },
  { key: 'evening' as const, label: '晚上' },
];

export function ScheduleModal({ stepId, schedules, onClose }: ScheduleModalProps) {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const { updateStepSchedules } = useStore();

  function toggleSlot(slot: string) {
    const next = new Set(selectedSlots);
    if (next.has(slot)) next.delete(slot);
    else next.add(slot);
    setSelectedSlots(next);
  }

  async function handleAdd() {
    const newSchedules: ScheduleType[] = [...schedules];
    for (const slot of selectedSlots) {
      const exists = newSchedules.some((s) => s.date === date && s.slot === slot);
      if (!exists) {
        newSchedules.push({ date, slot: slot as ScheduleType['slot'] });
      }
    }
    await updateStepSchedules(stepId, newSchedules);
    onClose();
  }

  async function handleRemove(idx: number) {
    const newSchedules = schedules.filter((_, i) => i !== idx);
    await updateStepSchedules(stepId, newSchedules);
  }

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-xl p-5 w-80 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-semibold text-stone-800 mb-3">安排到日历</h3>

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-stone-500 mb-1">日期</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-stone-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-mocha"
            />
          </div>

          <div>
            <label className="block text-xs text-stone-500 mb-1">时段</label>
            <div className="flex gap-2">
              {SLOTS.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => toggleSlot(s.key)}
                  className={`flex-1 text-xs py-1.5 rounded-md border transition ${
                    selectedSlots.has(s.key)
                      ? 'bg-mocha text-white border-mocha'
                      : 'bg-stone-50 border-stone-200 text-stone-500'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleAdd}
            disabled={selectedSlots.size === 0}
            className="w-full bg-ink-muted text-cream-50 text-xs py-2 rounded-lg disabled:opacity-40 transition"
          >
            添加
          </button>
        </div>

        {schedules.length > 0 && (
          <div className="mt-4 border-t border-stone-100 pt-3">
            <p className="text-xs text-stone-500 mb-2">已安排</p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {schedules.map((sch, i) => (
                <div key={i} className="flex items-center justify-between text-xs bg-stone-50 rounded px-2 py-1">
                  <span className="text-stone-700">
                    {sch.date} · {SLOTS.find((s) => s.key === sch.slot)?.label}
                  </span>
                  <button onClick={() => handleRemove(i)} className="text-stone-400 hover:text-red-500">✕</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
