import { z } from 'zod';
import { AppError } from '../middleware/error.js';
import { SYSTEM_PROMPT, buildUserPrompt } from './prompt.js';

const BreakdownResponse = z.object({
  steps: z.array(z.string().min(1).max(200)),
});

interface BreakdownInput {
  title: string;
  description?: string;
  ddl: string;
  stepSize: string;
}

export async function callDeepSeek(input: BreakdownInput): Promise<string[]> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const baseUrl = process.env.DEEPSEEK_BASE_URL ?? 'https://api.deepseek.com';
  const model = process.env.DEEPSEEK_MODEL ?? 'deepseek-chat';

  if (!apiKey) {
    throw new AppError('AI_PROVIDER_ERROR', 'DEEPSEEK_API_KEY not configured');
  }

  let res: Response;
  try {
    res = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserPrompt(input) },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      }),
    });
  } catch (e) {
    throw new AppError('AI_PROVIDER_ERROR', `Network error: ${(e as Error).message}`);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new AppError('AI_PROVIDER_ERROR', `DeepSeek API ${res.status}: ${text.slice(0, 200)}`);
  }

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    throw new AppError('AI_PARSE_ERROR', 'Failed to parse DeepSeek response as JSON');
  }

  const content = (body as { choices?: { message?: { content?: string } }[] })
    ?.choices?.[0]?.message?.content;

  if (!content) {
    throw new AppError('AI_PARSE_ERROR', 'Empty response from DeepSeek');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new AppError('AI_PARSE_ERROR', `Invalid JSON in AI response: ${content.slice(0, 100)}`);
  }

  const result = BreakdownResponse.safeParse(parsed);
  if (!result.success) {
    throw new AppError('AI_PARSE_ERROR', `Response schema mismatch: ${result.error.message.slice(0, 200)}`);
  }

  return result.data.steps;
}
