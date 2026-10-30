/**
 * The useful sentence from a failed `$fetch` (ofetch) call.
 *
 * The API's error handler answers `text/plain`, so the message is `err.data` AS A STRING, not
 * `err.data.message` — reading the latter yielded undefined and callers fell back to ofetch's own
 * `[POST] "…": 403 Forbidden`, which names the transport instead of the refusal. The `enrolment`
 * flavour of this lives in autonomous-agent-enrolment-error.ts and is not shared because it appends
 * the HTTP status for an admin-facing dialog; this one returns the server's sentence only.
 */
export function apiErrorMessage (err: any): string | undefined {
  const fromBody = typeof err?.data === 'string' ? err.data : err?.data?.message ?? err?.data?.error
  return [fromBody, err?.message].find(part => typeof part === 'string' && part.trim().length > 0)
}
