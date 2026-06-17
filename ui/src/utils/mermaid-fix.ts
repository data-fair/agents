// Bound on the automatic diagram-fix retry. A failed render fires at most this many
// automatic fixes per user turn, so a model that keeps emitting broken Mermaid cannot
// loop indefinitely. Once spent, only the manual "Fix this diagram" button remains.
export const MERMAID_AUTO_FIX_BUDGET = 1

export interface MermaidAutoFixState {
  // remaining automatic fixes for the current user turn
  budget: number
  // a reply is currently streaming — never interrupt it with a fix turn
  isStreaming: boolean
  // the failed diagram is in the latest message — older diagrams re-rendering (e.g. on
  // a theme switch) must not retrigger a fix
  isLatestMessage: boolean
}

// Decides whether a failed Mermaid diagram should be fixed automatically. Pure so the
// bounding rule stays unit-testable independently of the Vue components that own the state.
export function shouldAutoFixMermaid ({ budget, isStreaming, isLatestMessage }: MermaidAutoFixState): boolean {
  return budget > 0 && !isStreaming && isLatestMessage
}

// Builds the hidden-context instruction sent to the assistant when the user asks to fix a
// Mermaid diagram that failed to render. Kept pure (no i18n) because it is a model-facing
// instruction, not user-visible copy — so it stays deterministically unit-testable.
export function formatMermaidFix (error: string, source: string): string {
  return [
    'The previous Mermaid diagram failed to render with this error:',
    error,
    '',
    'Its source was:',
    '```mermaid',
    source,
    '```',
    '',
    "Resend your previous answer with the diagram's syntax corrected."
  ].join('\n')
}
