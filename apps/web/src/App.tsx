import { useEffect, useState } from 'react';
import { CreateForm } from './features/create/CreateForm';
import { Board } from './features/board/Board';
import { ArchivedList } from './features/archive/ArchivedList';
import { CalendarMonth } from './features/calendar/CalendarMonth';
import { TodaySchedule } from './features/today/TodaySchedule';
import { ToastContainer } from './components/Toast';
import { useStore } from './store';

function App() {
  const fetchAll = useStore((s) => s.fetchAll);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return (
    <div className="bg-cream-50 text-ink-light h-screen flex flex-col p-6 selection:bg-stone-200">
      {/* Header */}
      <header className="max-w-[1400px] w-full mx-auto mb-4 flex items-baseline justify-between shrink-0">
        <h1 className="text-2xl font-medium text-ink tracking-tight">试图在DDL中存活</h1>
        <div className="flex items-center gap-4 text-sm text-stone-500">
          <span>完成比完美更重要✅</span>
          <span>再不开始行动就没法睡觉啦💤</span>
        </div>
      </header>

      {/* Main grid */}
      <main className="max-w-[1400px] w-full mx-auto grid grid-cols-12 gap-5 flex-1 min-h-0">
        {/* Left column: 01 + 03 */}
        <section className="col-span-4 flex flex-col gap-5 min-h-0">
          <CreateForm />
          <ArchivedList />
        </section>

        {/* Right column: 02 + (04 + 05) */}
        <section className="col-span-8 flex flex-col gap-5 min-h-0">
          <Board />
          <div className="grid grid-cols-12 gap-5 flex-1 min-h-0">
            <CalendarMonth selectedDate={selectedDate} onSelectDate={setSelectedDate} />
            <TodaySchedule selectedDate={selectedDate} />
          </div>
        </section>
      </main>

      <ToastContainer />
    </div>
  );
}

export default App;
