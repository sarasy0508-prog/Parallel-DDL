import { useState, useMemo } from 'react';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameMonth, isToday, addMonths, subMonths,
  isSameDay,
} from 'date-fns';
import { useStore } from '../../store';

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

interface CalendarMonthProps {
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
}

export function CalendarMonth({ selectedDate, onSelectDate }: CalendarMonthProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const projects = useStore((s) => s.projects);

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  const scheduledDates = useMemo(() => {
    const dates = new Set<string>();
    for (const p of projects) {
      for (const s of p.steps) {
        for (const sch of s.schedules) {
          dates.add(sch.date);
        }
      }
    }
    return dates;
  }, [projects]);

  const overdueDdlDates = useMemo(() => {
    const dates = new Set<string>();
    const now = new Date();
    for (const p of projects) {
      if (p.status === 'overdue' || (p.status !== 'completed' && p.status !== 'archived' && new Date(p.ddl) < now)) {
        dates.add(format(new Date(p.ddl), 'yyyy-MM-dd'));
      }
    }
    return dates;
  }, [projects]);

  const futureDdlDates = useMemo(() => {
    const dates = new Set<string>();
    const now = new Date();
    for (const p of projects) {
      if (p.status !== 'completed' && p.status !== 'archived' && new Date(p.ddl) >= now) {
        dates.add(format(new Date(p.ddl), 'yyyy-MM-dd'));
      }
    }
    return dates;
  }, [projects]);

  return (
    <div className="col-span-5 bg-white rounded-2xl p-4 shadow-sm border border-stone-100 flex flex-col min-h-0">
      <div className="flex justify-between items-center mb-3 shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-stone-400 rounded-full" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400">04 / 日历</h3>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="text-stone-400 hover:text-stone-700 text-xs">◀</button>
          <span className="text-[11px] text-stone-500">{format(currentMonth, 'yyyy 年 M 月')}</span>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="text-stone-400 hover:text-stone-700 text-xs">▶</button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] font-semibold text-stone-400 mb-1">
        {WEEKDAYS.map((d) => <span key={d}>{d}</span>)}
      </div>

      <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] text-stone-600">
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const inMonth = isSameMonth(day, currentMonth);
          const today = isToday(day);
          const isOverdue = overdueDdlDates.has(dateStr);
          const isFutureDdl = futureDdlDates.has(dateStr);
          const hasSchedule = scheduledDates.has(dateStr);
          const isSelected = selectedDate && isSameDay(day, selectedDate);

          let cls = 'p-0.5 relative cursor-pointer rounded transition-colors';
          if (!inMonth) cls += ' text-stone-300';
          if (today) cls += ' font-bold bg-mocha text-white';
          else if (isOverdue) cls += ' font-bold text-red-600 bg-red-50';
          else if (isSelected) cls += ' bg-cream-300 font-medium';

          return (
            <span key={dateStr} className={cls} onClick={() => onSelectDate(day)}>
              {day.getDate()}
              {isOverdue && <span className="absolute -top-0.5 -right-0 text-[6px]">⚠</span>}
              {(hasSchedule || isFutureDdl) && !today && !isOverdue && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-mocha rounded-full" />
              )}
            </span>
          );
        })}
      </div>

      <div className="mt-auto pt-2 border-t border-stone-100 flex items-center justify-around text-[9px] text-stone-400 shrink-0">
        <div className="flex items-center gap-1">
          <span className="w-1 h-1 bg-mocha rounded-full" />
          <span>未来DDL</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-red-500 text-[9px]">⚠</span>
          <span>已逾期</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-mocha rounded-sm" />
          <span>今天</span>
        </div>
      </div>
    </div>
  );
}
