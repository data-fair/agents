/**
 * One shared builder that turns a single streamed part into mutations on a
 * StreamScope. Both the main assistant stream and every sub-agent stream feed
 * their parts through this, so the two transcripts are built identically
 * (previously the sub-agent used its own snapshot converter that could drift).
 * Kept free of Vue/DOM and of the `ai` runtime (structural types only) so it can
 * be unit-tested directly by the node test runner.
 */

// Structural subset of ChatMessage the builder reads/writes; the real
// ChatMessage (from use-agent-chat) is assignable to this.
export interface StreamMessage {
  role: 'user' | 'assistant'
  content: string
  // Reasoning ("thinking") tokens captured from reasoning models, accumulated
  // before the visible content/tool calls of the same assistant step.
  reasoning?: string
  toolInvocations?: { toolCallId: string, toolName: string, state: 'pending' | 'done' }[]
}

// Structural subset of the AI SDK's TextStreamPart covering the parts we build
// from; real TextStreamPart is assignable to this. Other part types are ignored.
export interface StreamPart {
  type: string
  text?: string
  toolCallId?: string
  toolName?: string
  preliminary?: boolean
}

export type ActivityPhase = 'streaming' | 'tool' | 'analyzing' | 'thinking'

export interface StreamScope {
  // Sink for assistant messages. MUST be the reactive array under Vue
  // (messages.value, or a panel's subAgentPanels[id].messages) so the read-back yields a
  // reactive proxy whose mutations the UI observes.
  messages: StreamMessage[]
  // Message currently being appended to; reset to null at each finish-step.
  current: StreamMessage | null
  // True once any assistant text was produced (drives the empty-turn fallback).
  producedText: boolean
  // True when the current step issued a tool call (drives analyzing vs thinking).
  stepHadTool: boolean
  // toolName of the latest tool-call this step, surfaced so the post-step label
  // can name a sub-agent.
  lastToolName?: string
  // Per-scope policy: maps the logical phase to the UI activity indicator.
  setActivity: (phase: ActivityPhase, toolName?: string) => void
}

export function applyStreamPart (part: StreamPart, scope: StreamScope): void {
  switch (part.type) {
    case 'reasoning-delta': {
      // Reasoning streams before the visible answer; show the 'thinking' label and
      // accumulate it onto the (possibly not-yet-created) current assistant message.
      if (part.text) scope.setActivity('thinking')
      if (!scope.current) {
        scope.messages.push({ role: 'assistant', content: '' })
        scope.current = scope.messages[scope.messages.length - 1]
      }
      scope.current.reasoning = (scope.current.reasoning ?? '') + (part.text ?? '')
      break
    }
    case 'text-delta': {
      // Text is visibly streaming (markdown cursor); drop the gap label.
      if (part.text) { scope.producedText = true; scope.setActivity('streaming') }
      if (!scope.current) {
        scope.messages.push({ role: 'assistant', content: '' })
        // Read back so we mutate the reactive proxy, not the raw object.
        scope.current = scope.messages[scope.messages.length - 1]
      }
      scope.current.content += part.text ?? ''
      break
    }
    case 'tool-call': {
      // The tool chip (pending) is the in-transcript signal; name the tool so the
      // post-step label can mention a sub-agent.
      scope.stepHadTool = true
      scope.lastToolName = part.toolName
      scope.setActivity('tool', part.toolName)
      if (!scope.current) {
        scope.messages.push({ role: 'assistant', content: '', toolInvocations: [] })
        scope.current = scope.messages[scope.messages.length - 1]
      }
      if (!scope.current.toolInvocations) scope.current.toolInvocations = []
      scope.current.toolInvocations.push({
        toolCallId: part.toolCallId ?? '',
        toolName: part.toolName ?? '',
        state: 'pending'
      })
      break
    }
    case 'tool-result': {
      // Async-generator tools emit preliminary results; only the final one settles.
      if (!part.preliminary && scope.current?.toolInvocations) {
        const inv = scope.current.toolInvocations.find(ti => ti.toolCallId === part.toolCallId)
        if (inv) inv.state = 'done'
      }
      break
    }
    case 'tool-error': {
      // execute threw: the SDK feeds the error back but emits no tool-result, so
      // settle the chip here to stop it spinning forever.
      if (scope.current?.toolInvocations) {
        const inv = scope.current.toolInvocations.find(ti => ti.toolCallId === part.toolCallId)
        if (inv) inv.state = 'done'
      }
      break
    }
    case 'finish-step': {
      // New step → new assistant message. A step that called a tool is normally
      // followed by a continuation step reading the result — label that gap.
      scope.current = null
      scope.setActivity(scope.stepHadTool ? 'analyzing' : 'thinking', scope.lastToolName)
      scope.stepHadTool = false
      scope.lastToolName = undefined
      break
    }
  }
}
