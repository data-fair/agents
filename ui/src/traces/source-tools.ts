import { tool, jsonSchema } from 'ai'
import type { Tool } from 'ai'

const EXPLORE_GITHUB_DESCRIPTION = [
  'Read source code from the platform\'s own public GitHub repos, as ground truth for how a feature actually behaves. Read-only GET against the GitHub REST API, scoped to these repos:',
  '- data-fair/agents (this service) — start at docs/architecture/, api/src/, ui/src/traces/',
  '- data-fair/data-fair — start at agent-tools/ (the server-side tools the assistant calls)',
  '- data-fair/portals — start at portal/app/composables/agent/ (client-side agent tools)',
  '- json-layout/json-layout — start at core/src/webmcp/tools/ (the MCP form tools backing the *_form form sub-agents, e.g. pageConfig_form, portalConfig_form)',
  'Useful endpoints (pass as `path`):',
  '- /repos/{owner}/{repo}/git/trees/{ref}?recursive=1 — list every file (use `query`="recursive=1")',
  '- /repos/{owner}/{repo}/contents/{path} with raw=true — read a file as text',
  '- /repos/{owner}/{repo}/contents/{dir} — list a directory',
  'Version note: the agents repo matches its deployed release tag; data-fair/portals default to the main branch. Be frugal — the GitHub API is rate-limited.'
].join('\n')

/** Superadmin-only source-exploration tool, routed through the /api/admin/github proxy. */
export function buildSourceTools (opts: { apiPath: string }): Record<string, Tool> {
  return {
    explore_github: tool({
      description: EXPLORE_GITHUB_DESCRIPTION,
      inputSchema: jsonSchema({
        type: 'object',
        properties: {
          path: { type: 'string', description: 'GitHub API path under "/repos/<owner>/<repo>", e.g. "/repos/data-fair/agents/contents/docs/architecture"' },
          query: { type: 'string', description: 'Optional query string without leading "?", e.g. "recursive=1"' },
          raw: { type: 'boolean', description: 'Set true to fetch a file\'s raw text content instead of base64 JSON metadata' }
        },
        required: ['path']
      }),
      execute: async (args: { path: string, query?: string, raw?: boolean }) => {
        const params = new URLSearchParams({ path: args.path })
        if (args.query) params.set('query', args.query)
        if (args.raw) params.set('raw', '1')
        try {
          const res = await fetch(`${window.location.origin}${opts.apiPath}/admin/github?${params.toString()}`, { credentials: 'include' })
          const text = await res.text()
          if (!res.ok) return `GitHub exploration failed (HTTP ${res.status}): ${text}`
          return text
        } catch (err) {
          return `GitHub request failed: ${err instanceof Error ? err.message : String(err)}`
        }
      }
    })
  }
}
