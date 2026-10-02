// Hidden context (from agent action buttons) is carried INSIDE the triggering
// user message, wrapped in these sentinels, so it reaches the model as part of
// the user turn instead of being merged into the session system prompt. The chat
// UI renders only the visible prompt; trace reconstruction splits it back out.
// The server-side moderation gate deliberately does NOT strip this wrapper: it
// classifies the full user message, since a direct API caller could otherwise
// forge the sentinels to smuggle content past the gate.
export const HIDDEN_CONTEXT_OPEN = '<hidden-context>'
export const HIDDEN_CONTEXT_CLOSE = '</hidden-context>'

export function wrapHiddenContext (hiddenContext: string, visiblePrompt: string): string {
  return `${HIDDEN_CONTEXT_OPEN}\n${hiddenContext}\n${HIDDEN_CONTEXT_CLOSE}\n\n${visiblePrompt}`
}

const HIDDEN_CONTEXT_RE = /^<hidden-context>\n([\s\S]*?)\n<\/hidden-context>\n\n([\s\S]*)$/

export function splitHiddenContext (content: string): { visible: string, hidden?: string } {
  const m = HIDDEN_CONTEXT_RE.exec(content)
  if (!m) return { visible: content }
  return { visible: m[2], hidden: m[1] }
}
