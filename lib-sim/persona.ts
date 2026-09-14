/**
 * The simulated user.
 *
 * It is a person with a goal, not a test script: it may be vague, change its
 * mind, or push back, which is what makes this a simulation rather than a
 * fixture. It runs under the same isolation as every other Claude role here —
 * launched from this repo it would inherit the auto-memory index and know the
 * bugs the scenario exists to find (spec §1.2).
 */
import { createNeutralCwd, isolationOptions } from './isolation.ts'
import { MISSING_SDK_MESSAGE, isMissingSdkError } from './missing-sdk.ts'
import type { SimulationCase } from './types.ts'

export const DONE = 'DONE'
let neutralCwd: string | undefined

export function isDone (message: string): boolean {
  if (!message) return false

  // Normalize the message: trim, strip quotes/backticks, strip trailing punctuation, uppercase
  let normalized = message.trim()

  // Strip surrounding quotes or backticks
  if ((normalized.startsWith('"') && normalized.endsWith('"')) ||
      (normalized.startsWith("'") && normalized.endsWith("'")) ||
      (normalized.startsWith('`') && normalized.endsWith('`'))) {
    normalized = normalized.slice(1, -1)
  }

  // Strip trailing punctuation
  normalized = normalized.replace(/[.!,:]+$/, '')

  // Uppercase and check if exactly DONE
  normalized = normalized.toUpperCase().trim()

  // Only true if it is exactly DONE, not a sentence containing the word
  return normalized === DONE
}

export function personaSystemPrompt (c: SimulationCase): string {
  return [
    c.persona,
    '',
    `What you want: ${c.goal}`,
    '',
    'You are talking to an assistant through a chat box on a web page. Behave like a real person:',
    '- Say what you want in your own words. Do not explain how the assistant should do it.',
    '- If a reply is vague, unhelpful, or does not actually show you the result, say so.',
    '- If you are asked a question, answer it.',
    '- Do not be artificially cooperative, and do not thank the assistant for work it has not done.',
    '',
    'Reply with ONLY the message you would type next — no quotes, no narration, no stage directions.',
    `When you have what you wanted, or you are convinced you will not get it, reply with exactly ${DONE} and nothing else.`
  ].join('\n')
}

export function personaPrompt (conversation: Array<{ role: string, text: string }>, turnsLeft: number): string {
  if (conversation.length === 0) return 'Write your first message to the assistant.'
  const transcript = conversation.map(m => `${m.role === 'user' ? 'you' : 'assistant'}: ${m.text}`).join('\n\n')
  const warning = turnsLeft <= 1
    ? '\n\nThis is your last message. If you already have what you needed, reply ' + DONE + '.'
    : ''
  return [
    'The conversation so far:',
    '',
    transcript,
    '',
    `Write your next message, or ${DONE} if you are finished.${warning}`
  ].join('\n')
}

export async function nextUserMessage (
  c: SimulationCase,
  conversation: Array<{ role: string, text: string }>,
  turnsLeft: number
): Promise<string> {
  // Loaded here, not at module top level, so importing the package barrel
  // never requires the Agent SDK — it is an optional peer, and a consumer who
  // only wants the harness primitives must not pay for it. This is the only
  // place in the exported surface that reaches for it at runtime.
  let query: (typeof import('@anthropic-ai/claude-agent-sdk'))['query']
  try {
    ({ query } = await import('@anthropic-ai/claude-agent-sdk'))
  } catch (err) {
    if (isMissingSdkError(err)) throw new Error(MISSING_SDK_MESSAGE)
    throw err
  }

  neutralCwd ??= createNeutralCwd()
  let text = ''
  for await (const msg of query({
    prompt: personaPrompt(conversation, turnsLeft),
    options: {
      ...isolationOptions(neutralCwd),
      model: process.env.SIM_USER_MODEL ?? 'haiku',
      systemPrompt: personaSystemPrompt(c),
      maxTurns: 1
    }
  })) {
    if (msg.type === 'assistant') {
      for (const block of (msg as any).message?.content ?? []) {
        if (block.type === 'text' && block.text) text += block.text
      }
    }
  }
  return text.trim()
}
