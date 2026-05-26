export const SYSTEM_PROMPT = `你是一个任务拆解助手。用户会给你一个任务的标题、描述、截止日期和期望的每步时长。
你需要将这个任务拆解为具体可执行的小步骤。

要求：
1. 每个步骤应该是一个具体的行动项，而非模糊的描述
2. 步骤之间有逻辑顺序
3. 每个步骤的预估用时应接近用户指定的时长
4. 步骤数量根据任务复杂度自行决定（通常 3-8 个）
5. 全部用中文回答

输出格式为 JSON：
{
  "steps": ["步骤1内容", "步骤2内容", ...]
}

只输出 JSON，不要输出其他内容。`;

export function buildUserPrompt(input: {
  title: string;
  description?: string;
  ddl: string;
  stepSize: string;
}): string {
  const parts = [
    `任务名称：${input.title}`,
    input.description ? `任务描述：${input.description}` : null,
    `截止日期：${input.ddl}`,
    `期望每步时长：${input.stepSize}`,
  ];
  return parts.filter(Boolean).join('\n');
}
