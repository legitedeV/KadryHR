#!/usr/bin/env node
import 'dotenv/config';
import OpenAI from 'openai';
import simpleGit from 'simple-git';
import { SYSTEM_PROMPT, TASK_PROMPTS } from './prompts.mjs';

const MODEL = process.env.KADRYHR_AGENT_MODEL || 'gpt-4.1-mini';

async function main() {
  const mode = process.argv[2] || 'plan';
  if (!['plan', 'pr-review'].includes(mode)) {
    console.error('Usage: kadryhr-agent [plan|pr-review]');
    process.exit(1);
  }

  const git = simpleGit({ baseDir: process.cwd() });
  let diff = '';
  try {
    // Prefer staged diff; fall back to last commit if nothing staged
    const staged = await git.diff(['--cached']);
    diff = staged || await git.diff(['HEAD~1..HEAD']);
  } catch (err) {
    console.error('Failed to read git diff:', err);
  }

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const userPrompt = `
Repo: KadryHR (backend-v2 + frontend-v2 monorepo).

Task mode: ${mode}

Git diff (staged or last commit):

------------------8<------------------
${diff || '(no diff available – describe what you want to do in the prompt)'}
------------------8<------------------

Use the system instructions and task mode to generate your response.
`;

  const systemMessage = {
    role: 'system',
    content: SYSTEM_PROMPT.trim(),
  };

  const taskMessage = {
    role: 'user',
    content: TASK_PROMPTS[mode].trim() + '\\n\\n' + userPrompt,
  };

  console.error('[kadryhr-agent] Calling OpenAI model:', MODEL);
  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [systemMessage, taskMessage],
    temperature: 0.2,
  });

  const text = completion.choices[0]?.message?.content || '';
  console.log(text.trim());
}

main().catch((err) => {
  console.error('[kadryhr-agent] Fatal error:', err);
  process.exit(1);
});
