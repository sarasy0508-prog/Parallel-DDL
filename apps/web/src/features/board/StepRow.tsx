interface StepRowProps {
  content: string;
  done: boolean;
  isOverdue?: boolean;
  hasSchedule?: boolean;
}

export function StepRow({ content, done, isOverdue, hasSchedule }: StepRowProps) {
  return (
    <div className="step-row group/step flex items-center gap-2 py-0.5">
      <span className="opacity-0 group-hover/step:opacity-100 text-stone-400 cursor-grab text-xs select-none transition-opacity">
        ⋮⋮
      </span>
      <input
        type="checkbox"
        checked={done}
        readOnly
        className={`rounded shrink-0 ${isOverdue ? 'accent-red-500' : 'accent-mocha'}`}
      />
      <span
        className={`flex-1 text-xs ${
          done
            ? 'text-stone-400 line-through'
            : isOverdue
              ? 'text-red-700'
              : 'text-stone-700'
        }`}
      >
        {content}
      </span>
      <div className="opacity-0 group-hover/step:opacity-100 flex items-center gap-1 transition-opacity">
        <button
          className={`p-0.5 ${hasSchedule ? 'text-mocha' : 'text-stone-400 hover:text-mocha'}`}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill={hasSchedule ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
        </button>
        <button className="text-stone-400 hover:text-red-500 p-0.5">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
