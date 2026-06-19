/**
 * Pure helpers for the superadmin GitHub source-exploration proxy.
 * No #config / fetch / Vite imports here — this module is unit-tested by the
 * non-Vite runner. The HTTP handler lives in router.ts.
 */

export const GITHUB_SOURCE_REPOS = ['data-fair/agents', 'data-fair/data-fair', 'data-fair/portals'] as const

/** Validate a GitHub REST path: read-only access under one of the whitelisted repos. */
export function validateGithubSourcePath (path: string): { ok: true } | { ok: false, message: string } {
  if (typeof path !== 'string' || !path.startsWith('/repos/')) {
    return { ok: false, message: 'path must start with "/repos/"' }
  }
  if (path.includes('..') || path.includes('://') || path.includes('//')) {
    return { ok: false, message: 'invalid path' }
  }
  const [owner, repo] = path.slice('/repos/'.length).split('/')
  const slug = `${owner}/${repo}`
  if (!GITHUB_SOURCE_REPOS.includes(slug as typeof GITHUB_SOURCE_REPOS[number])) {
    return { ok: false, message: `repo not allowed: only ${GITHUB_SOURCE_REPOS.join(', ')} can be explored` }
  }
  return { ok: true }
}

export function buildGithubUrl (path: string, query?: string): string {
  return `https://api.github.com${path}${query ? '?' + query : ''}`
}

export function truncateGithubBody (text: string, max = 10_000): { text: string, truncated: boolean } {
  if (text.length <= max) return { text, truncated: false }
  return { text: text.slice(0, max), truncated: true }
}

export function githubErrorMessage (status: number, rateLimitRemaining: string | null, body: string): string {
  if (status === 403 && rateLimitRemaining === '0') return 'GitHub rate limit reached (try again later).'
  if (status === 404) return 'Not found'
  return `HTTP ${status}: ${truncateGithubBody(body, 500).text}`
}
