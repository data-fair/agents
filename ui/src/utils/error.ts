/**
 * Extract a meaningful error message from AI SDK errors.
 * Walks the error cause chain to find structured error data
 * (e.g. quota exceeded 429 responses, permission denied 403 responses).
 */
export function extractErrorMessage (err: unknown): string {
  if (!err) return 'Unknown error'
  if (typeof err === 'string') return err
  // Walk the error chain (err -> cause -> cause...) to find the most specific message.
  // The AI SDK wraps HTTP errors (e.g. 429 quota exceeded) in generic errors;
  // the original APICallError with responseBody / data sits in the cause chain.
  let current: any = err
  while (current) {
    if (current.data?.error?.message) return current.data.error.message
    if (current.responseBody) {
      try {
        const body = JSON.parse(current.responseBody)
        if (body.error?.message) return body.error.message
      } catch {
        // plain-text error response (e.g. from Express error handler)
        // Take only the first line to avoid showing stack traces in dev mode
        if (typeof current.responseBody === 'string' && current.responseBody.trim()) {
          const firstLine = current.responseBody.trim().split('\n')[0]
          // Strip "STATUS - " prefix from dev error responses (e.g. "403 - Error: message")
          const cleaned = firstLine.replace(/^\d{3}\s*-\s*(Error:\s*)?/, '')
          if (cleaned) return cleaned
        }
      }
    }
    current = current.cause
  }
  const e = err as any
  if (e.message && e.message !== 'No output generated. Check the stream for errors.') return e.message
  return 'Unknown error'
}
