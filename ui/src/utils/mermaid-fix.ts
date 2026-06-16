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
