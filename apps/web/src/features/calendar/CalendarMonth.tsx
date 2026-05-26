const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

const MOCK_DAYS = [
  // Row 1 (prev month fill)
  { day: 26, muted: true }, { day: 27, muted: true }, { day: 28, muted: true },
  { day: 29, muted: true }, { day: 30, muted: true }, { day: 1 }, { day: 2 },
  // Row 2
  { day: 3 }, { day: 4 }, { day: 5, overdue: true }, { day: 6 }, { day: 7 },
  { day: 8 }, { day: 9 },
  // Row 3
  { day: 10 }, { day: 11 }, { day: 12 }, { day: 13, today: true }, { day: 14 },
  { day: 15 }, { day: 16, hasSchedule: true },
  // Row 4
  { day: 17 }, { day: 18 }, { day: 19 }, { day: 20 }, { day: 21, hasSchedule: true },
  { day: 22 }, { day: 23 },
  // Row 5
  { day: 24 }, { day: 25 }, { day: 26 }, { day: 27 }, { day: 28, hasSchedule: true },
  { day: 29 }, { day: 30 },
  // Row 6
  { day: 31 }, { day: 1, muted: true }, { day: 2, muted: true }, { day: 3, muted: true },
  { day: 4, muted: true }, { day: 5, muted: true }, { day: 6, muted: true },
];

export function CalendarMonth() {
  return (
    <div className="col-span-5 bg-white rounded-2xl p-4 shadow-sm border border-stone-100 flex flex-col min-h-0">
      <div className="flex justify-between items-center mb-3 shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-stone-400 rounded-full" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400">04 / 日历</h3>
        </div>
        <span className="text-[11px] text-stone-500">2026 年 5 月</span>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] font-semibold text-stone-400 mb-1">
        {WEEKDAYS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] text-stone-600">
        {MOCK_DAYS.map((d, i) => {
          let cls = 'p-0.5 relative';
          if (d.muted) cls += ' text-stone-300';
          if (d.today) cls += ' font-bold bg-mocha text-white rounded';
          if (d.overdue) cls += ' font-bold text-red-600 bg-red-50 rounded';
          return (
            <span key={i} className={cls}>
              {d.day}
              {d.overdue && (
                <span className="absolute -top-0.5 -right-0 text-[6px]">⚠</span>
              )}
              {d.hasSchedule && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-mocha rounded-full" />
              )}
            </span>
          );
        })}
      </div>

      {/* Legend */}
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
