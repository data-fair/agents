/**
 * HTTP layer for the Claude Code bridge. Dev-only: presents the Claude Agent SDK
 * as an OpenAI-compatible provider so the dev workspace can run on subscription
 * models. Never imported by api/, ui/ or the published libs.
 */
import http from 'node:http'
import crypto from 'node:crypto'
import { query } from '@anthropic-ai/claude-agent-sdk'
import { createNeutralCwd, isolationOptions } from './isolation.ts'
import { createToolServer } from './tool-server.ts'
import { SessionStore, continuationOf, hashMessages } from './sessions.ts'
import { Conversation, type TurnOutcome, type SdkMessage } from './conversation.ts'
import {
  extractSystemPrompt, renderTranscript, toolNameToMcp, textChunk, toolCallsChunk,
  finalChunk, errorBody, MCP_SERVER_NAME,
  type OpenAIMessage, type OpenAIToolDef
} from './openai.ts'

// The settings UI populates its dropdown from GET {baseURL}/models
// (api/src/models/router.ts fetchOpenAICompatibleModels). A fixed list avoids a
// network round trip; ids are what get passed back as the `model` field.
export const MODELS = [
  { id: 'opus', name: 'Claude Opus (Claude Code default alias)' },
  { id: 'sonnet', name: 'Claude Sonnet (Claude Code default alias)' },
  { id: 'haiku', name: 'Claude Haiku (Claude Code default alias)' },
  { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5' }
]

// One neutral cwd for the process: the isolation guarantee only needs it to be
// outside any project, and re-creating it per request would litter /tmp.
const NEUTRAL_CWD = createNeutralCwd()

type CompletionRequest = {
  model?: string
  messages?: OpenAIMessage[]
  tools?: OpenAIToolDef[]
}

function readBody (req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let raw = ''
    req.on('data', c => { raw += c })
    req.on('end', () => { resolve(raw) })
    req.on('error', reject)
  })
}

export function createServer (opts: { port: number }) {
  const store = new SessionStore()
  const sweeper = setInterval(() => { store.sweep() }, 60000)
  sweeper.unref()

  const server = http.createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/v1/models') {
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ object: 'list', data: MODELS }))
      return
    }
    if (req.method === 'GET' && req.url === '/_bridge/status') {
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ liveSessions: store.size, cwd: NEUTRAL_CWD }))
      return
    }
    if (req.method === 'POST' && req.url === '/v1/chat/completions') {
      handleCompletion(req, res, store).catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err)
        console.error('claude-bridge request failed:', message)
        if (!res.headersSent) {
          res.writeHead(500, { 'content-type': 'application/json' })
          res.end(JSON.stringify(errorBody(message)))
        } else {
          res.write(`data: ${JSON.stringify(errorBody(message))}\n\n`)
          res.end()
        }
      })
      return
    }
    res.writeHead(404, { 'content-type': 'application/json' })
    res.end(JSON.stringify(errorBody('not found', 'invalid_request_error')))
  })
  server.listen(opts.port)
  return server
}

async function handleCompletion (req: http.IncomingMessage, res: http.ServerResponse, store: SessionStore) {
  const body = JSON.parse(await readBody(req)) as CompletionRequest
  const messages = body.messages ?? []
  const tools = body.tools ?? []
  const model = body.model ?? 'sonnet'
  const id = `chatcmpl-${crypto.randomUUID()}`

  res.writeHead(200, {
    'content-type': 'text/event-stream',
    'cache-control': 'no-cache',
    connection: 'keep-alive'
  })
  const send = (payload: object) => { res.write(`data: ${JSON.stringify(payload)}\n\n`) }
  const sink = (text: string) => { send(textChunk(id, model, text)) }

  // --- fast path: hand the tool results to the query that is waiting for them ---
  const continuation = continuationOf(messages)
  if (continuation) {
    const live = store.get(continuation.key) as Conversation | undefined
    if (live && live.awaits(continuation.toolResults.map(r => r.id))) {
      live.lastSeen = Date.now()
      // The history has grown by this turn, so the NEXT continuation hashes
      // against it. rekey, never delete+set: delete aborts the query.
      store.rekey(continuation.key, hashMessages(messages))
      const turn = live.beginTurn(sink)
      live.deliverToolResults(continuation.toolResults)
      finish(await turn, live, store, res, send, id, model)
      return
    }
    // Diverged, expired, or answering calls this session never made.
    if (live) store.delete(continuation.key)
  }

  // --- replay path: a fresh session carrying the whole history ---
  const key = hashMessages(messages)
  store.delete(key)
  const conv = new Conversation(key)
  const toolServer = createToolServer(tools, (name, args) => conv.handleToolCall(name, args))
  const iterator = query({
    prompt: renderTranscript(messages),
    options: {
      ...isolationOptions(NEUTRAL_CWD),
      model,
      systemPrompt: extractSystemPrompt(messages),
      mcpServers: { [MCP_SERVER_NAME]: toolServer },
      allowedTools: tools.map(t => toolNameToMcp(t.function.name))
    }
  }) as AsyncIterable<SdkMessage>
  store.set(conv)
  finish(await conv.beginTurn(sink, iterator), conv, store, res, send, id, model)
}

function finish (
  outcome: TurnOutcome, conv: Conversation, store: SessionStore,
  res: http.ServerResponse, send: (payload: object) => void, id: string, model: string
) {
  if (outcome.type === 'tools') {
    send(toolCallsChunk(id, model, outcome.calls))
    conv.handedBack(outcome.calls.length)
    send(finalChunk(id, model, 'tool_calls'))
    // The session stays alive: its handlers are suspended, waiting for the
    // results the client is about to compute.
  } else {
    if (outcome.type === 'error') send(errorBody(outcome.message))
    send(finalChunk(id, model, 'stop', outcome.type === 'done' ? outcome.usage : undefined))
    store.delete(conv.key)
  }
  res.write('data: [DONE]\n\n')
  res.end()
}
