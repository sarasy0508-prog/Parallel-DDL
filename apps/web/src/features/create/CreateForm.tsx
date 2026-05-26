import { useState } from 'react';

const STEP_SIZES = ['5 分钟', '10 分钟', '25 分钟', '45 分钟'] as const;

export function CreateForm() {
  const [selectedSize, setSelectedSize] = useState(2);

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100 shrink-0">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-1.5 h-1.5 bg-emerald-700 rounded-full" />
        <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-400">
          01 / 任务拆解
        </h2>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">任务名称</label>
          <input
            type="text"
            placeholder="比如：毕业论文初稿撰写"
            className="w-full bg-stone-50/50 border border-stone-200/80 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-mocha text-stone-800"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">任务描述</label>
          <textarea
            rows={2}
            placeholder="写下目前的整体思绪..."
            className="w-full bg-stone-50/50 border border-stone-200/80 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-mocha text-stone-800 resize-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">截止日期</label>
          <input
            type="date"
            className="w-full bg-stone-50/50 border border-stone-200/80 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-mocha text-stone-800"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1.5">
            每个步骤的大致时长
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {STEP_SIZES.map((size, i) => (
              <button
                key={size}
                onClick={() => setSelectedSize(i)}
                className={`text-center text-xs py-1.5 rounded-md border transition ${
                  selectedSize === i
                    ? 'bg-mocha text-white border-mocha'
                    : 'bg-stone-50 border-stone-200/80 text-stone-500'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
        <button className="w-full bg-ink-muted hover:bg-mocha-dark text-cream-50 text-xs font-medium py-2.5 rounded-lg tracking-wider transition duration-150">
          从最简单的第一步开始吧!
        </button>
      </div>
    </div>
  );
}
