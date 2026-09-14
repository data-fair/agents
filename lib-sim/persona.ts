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
import type { PagePerception } from './page-perception.ts'
import { MCP_SERVER_NAME } from './page-perception.ts'

export const DONE = 'DONE'
let neutralCwd: string | undefined

// The persona now looks and acts before replying, so one turn is not enough:
// look → act → look → reply, with room to spare. Low enough that a confused
// persona cannot spend the run clicking around. A starting point, to be revisited
// from a real run rather than guessed at twice.
export const PERSONA_MAX_TURNS = 6

export const PERCEPTION_INSTRUCTIONS = `You can look at the screen yourself with the look tool, and you can click and type
on the page. Before you say anything about what is or is not on the screen, look.
Never claim you cannot see something you have not looked for.
To talk to the assistant, just reply with your message — do not type it into the page.`

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

export function personaSystemPrompt (c: SimulationCase, perceptionEnabled = false): string {
  const lines = [
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
  ]
  if (perceptionEnabled) {
    lines.push('', PERCEPTION_INSTRUCTIONS)
  }
  return lines.join('\n')
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
  turnsLeft: number,
  opts?: { perception?: PagePerception }
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
      systemPrompt: personaSystemPrompt(c, !!opts?.perception),
      maxTurns: PERSONA_MAX_TURNS,
      ...(opts?.perception
        ? {
            // The perception server's `instance` is typed `unknown` in page-perception.ts
            // (it stays an MCP SDK Server without pulling the Agent SDK's own MCP types
            // into that module's public surface), so the Agent SDK's stricter
            // McpSdkServerConfigWithInstance shape needs a cast here at the boundary.
            mcpServers: { [MCP_SERVER_NAME]: opts.perception.server as any },
            allowedTools: opts.perception.toolNames.map(n => `mcp__${MCP_SERVER_NAME}__${n}`)
          }
        : {})
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
