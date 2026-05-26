import { useState, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface StepRowProps {
  id: string;
  content: string;
  done: boolean;
  isOverdue?: boolean;
  hasSchedule?: boolean;
  onToggle: (done: boolean) => void;
  onDelete: () => void;
  onUpdateContent: (content: string) => void;
}

export function StepRow({ id, content, done, isOverdue, hasSchedule, onToggle, onDelete, onUpdateContent }: StepRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(content);
  const inputRef = useRef<HTMLInputElement>(null);

  function startEdit() {
    setEditValue(content);
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function commitEdit() {
    setEditing(false);
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== content) {
      onUpdateContent(trimmed);
    }
  }

  function cancelEdit() {
    setEditing(false);
    setEditValue(content);
  }

  return (
    <div ref={setNodeRef} style={style} className="step-row group/step flex items-center gap-2 py-0.5">
      <span {...attributes} {...listeners} className="opacity-0 group-hover/step:opacity-100 text-stone-400 cursor-grab text-xs select-none transition-opacity">
        ⋮⋮
      </span>
      <input
        type="checkbox"
        checked={done}
        onChange={(e) => onToggle(e.target.checked)}
        className={`rounded shrink-0 ${isOverdue ? 'accent-red-500' : 'accent-mocha'}`}
      />
      {editing ? (
        <input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitEdit();
            if (e.key === 'Escape') cancelEdit();
          }}
          className="flex-1 text-xs text-stone-700 bg-white border border-mocha/40 rounded px-1 py-0.5 outline-none"
        />
      ) : (
        <span
          onDoubleClick={startEdit}
          className={`flex-1 text-xs cursor-text ${
            done
              ? 'text-stone-400 line-through'
              : isOverdue
                ? 'text-red-700'
                : 'text-stone-700'
          }`}
        >
          {content}
        </span>
      )}
      <div className="opacity-0 group-hover/step:opacity-100 flex items-center gap-1 transition-opacity">
        <button
          className={`p-0.5 ${hasSchedule ? 'text-mocha' : 'text-stone-400 hover:text-mocha'}`}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill={hasSchedule ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
        </button>
        <button onClick={onDelete} className="text-stone-400 hover:text-red-500 p-0.5">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
