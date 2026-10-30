/**
 * A message for a failed simple-directory call that is never empty.
 *
 * Its own module rather than a helper inside the composable, for the same reason
 * autonomous-agent-draft.ts is: the composable imports `~/context`, which reads `window`, so nothing
 * in it can be unit-tested — and this is a pure function whose edge cases are exactly what needs
 * pinning.
 *
 * The dialog renders the result behind a `v-if`, so an empty message is indistinguishable from a
 * button that silently did nothing. `err.data?.message ?? err.data ?? err.message` returned '' for a
 * body-less 500 — `??` only skips null/undefined — and the admin saw no explanation at all.
 */
export function enrolmentErrorMessage (err: any): string {
  const fromBody = typeof err?.data === 'string' ? err.data : err?.data?.message ?? err?.data?.error
  const detail = [fromBody, err?.message].find(part => typeof part === 'string' && part.trim().length > 0)
  const status = err?.status ?? err?.statusCode ?? err?.response?.status
  if (detail) return status ? `${detail} (HTTP ${status})` : detail
  return status ? `the directory refused this request (HTTP ${status})` : 'the directory could not be reached'
}
