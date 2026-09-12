/**
 * The simulated user.
 *
 * It is a person with a goal, not a test script: it may be vague, change its
 * mind, or push back, which is what makes this a simulation rather than a
 * fixture. It runs under the same isolation as every other Claude role here —
 * launched from this repo it would inherit the auto-memory index and know the
 * bugs the scenario exists to find (spec §1.2).
 */
import { query } from '@anthropic-ai/claude-agent-sdk'
import { createNeutralCwd, isolationOptions } from '../../dev/claude-bridge/isolation.ts'
import type { SimulationCase } from '../cases/index.ts'

export const DONE = 'DONE'
let neutralCwd: string | undefined

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
