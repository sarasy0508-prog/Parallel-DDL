import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useStore } from '../../store';

const STEP_SIZE_VALUES = ['5min', '10min', '25min', '45min'] as const;

const CreateProjectSchema = z.object({
  title: z.string().min(1, '请填写任务名称').max(100),
  description: z.string().max(500).optional(),
  ddl: z.string().min(1, '请选择截止日期'),
  stepSize: z.enum(STEP_SIZE_VALUES),
});

type FormData = z.infer<typeof CreateProjectSchema>;

const STEP_SIZES: { value: FormData['stepSize']; label: string }[] = [
  { value: '5min', label: '5 分钟' },
  { value: '10min', label: '10 分钟' },
  { value: '25min', label: '25 分钟' },
  { value: '45min', label: '45 分钟' },
];

export function CreateForm() {
  const createProject = useStore((s) => s.createProject);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(CreateProjectSchema),
    defaultValues: { stepSize: '25min' },
  });

  const selectedSize = watch('stepSize');

  const aiBreakdown = useStore((s) => s.aiBreakdown);
  const confirmBreakdown = useStore((s) => s.confirmBreakdown);

  async function onSubmit(data: FormData) {
    const ddlISO = new Date(data.ddl + 'T23:59:59.000Z').toISOString();
    const projectId = await createProject({
      title: data.title,
      description: data.description,
      ddl: ddlISO,
      stepSize: data.stepSize,
    });
    if (!projectId) return;
    reset();

    const steps = await aiBreakdown(projectId, {
      title: data.title,
      description: data.description,
      ddl: ddlISO,
      stepSize: data.stepSize,
    });

    if (steps && steps.length > 0) {
      await confirmBreakdown(projectId, steps);
    }
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100 shrink-0">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-1.5 h-1.5 bg-emerald-700 rounded-full" />
        <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-400">
          01 / 任务拆解
        </h2>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">任务名称</label>
          <input
            {...register('title')}
            type="text"
            placeholder="比如：毕业论文初稿撰写"
            className="w-full bg-stone-50/50 border border-stone-200/80 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-mocha text-stone-800"
          />
          {errors.title && <p className="text-[10px] text-red-500 mt-0.5">{errors.title.message}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">任务描述</label>
          <textarea
            {...register('description')}
            rows={2}
            placeholder="写下目前的整体思绪..."
            className="w-full bg-stone-50/50 border border-stone-200/80 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-mocha text-stone-800 resize-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">截止日期</label>
          <input
            {...register('ddl')}
            type="date"
            className="w-full bg-stone-50/50 border border-stone-200/80 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-mocha text-stone-800"
          />
          {errors.ddl && <p className="text-[10px] text-red-500 mt-0.5">{errors.ddl.message}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1.5">
            每个步骤的大致时长
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {STEP_SIZES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setValue('stepSize', s.value)}
                className={`text-center text-xs py-1.5 rounded-md border transition ${
                  selectedSize === s.value
                    ? 'bg-mocha text-white border-mocha'
                    : 'bg-stone-50 border-stone-200/80 text-stone-500'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <button
          type="submit"
          className="w-full bg-ink-muted hover:bg-mocha-dark text-cream-50 text-xs font-medium py-2.5 rounded-lg tracking-wider transition duration-150"
        >
          从最简单的第一步开始吧!
        </button>
      </form>
    </div>
  );
}
