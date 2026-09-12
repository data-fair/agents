/**
 * HTTP layer for the Claude Code bridge. Dev-only: presents the Claude Agent SDK
 * as an OpenAI-compatible provider so the dev workspace can run on subscription
 * models. Never imported by api/, ui/ or the published libs.
 */
import http from 'node:http'

// The settings UI populates its dropdown from GET {baseURL}/models
// (api/src/models/router.ts fetchOpenAICompatibleModels). A fixed list avoids a
// network round trip; ids are what get passed back as the `model` field.
export const MODELS = [
  { id: 'opus', name: 'Claude Opus (Claude Code default alias)' },
  { id: 'sonnet', name: 'Claude Sonnet (Claude Code default alias)' },
  { id: 'haiku', name: 'Claude Haiku (Claude Code default alias)' },
  { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5' }
]

export function createServer (opts: { port: number }) {
  const server = http.createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/v1/models') {
      const body = JSON.stringify({ object: 'list', data: MODELS })
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(body)
      return
    }
    res.writeHead(404, { 'content-type': 'application/json' })
    res.end(JSON.stringify({ error: { message: 'not found', type: 'invalid_request_error' } }))
  })
  server.listen(opts.port)
  return server
}
