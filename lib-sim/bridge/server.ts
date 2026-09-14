/**
 * HTTP layer for the Claude Code bridge. Dev-only: presents the Claude Agent SDK
 * as an OpenAI-compatible provider so the dev workspace can run on subscription
 * models. Never imported by api/, ui/ or the published libs.
 */
import http from 'node:http'
import crypto from 'node:crypto'
import { query, type McpServerConfig } from '@anthropic-ai/claude-agent-sdk'
import { createNeutralCwd, isolationOptions } from '../isolation.ts'
import { createToolServer, TOOL_TIMEOUT_MS } from './tool-server.ts'
import { SessionStore, continuationOf, hashMessages, sameToolSet } from './sessions.ts'
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

// Hard ceiling on one HTTP request, so no upstream failure can hang the client
// forever. Equal to TOOL_TIMEOUT_MS in tool-server.ts: a suspended tool handler
// may legitimately wait that long (a tool wired to a human action button), so a
// shorter ceiling would cut off a legitimate turn, and a longer one would leave
// the client waiting past the point the SDK itself has given up.
const TURN_CEILING_MS = TOOL_TIMEOUT_MS

// Dev-only and unauthenticated: it spends the developer's subscription. Binding
// 0.0.0.0 would offer that to anyone on the network.
const HOST = '127.0.0.1'

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
        if (res.writableEnded) return
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
  server.listen(opts.port, HOST)
  return server
}

/**
 * Race a turn against the ceiling. Every await of a turn goes through here:
 * a promise that never settles used to leave the SSE response open forever.
 */
function withCeiling (turn: Promise<TurnOutcome>): Promise<TurnOutcome> {
  let timer: NodeJS.Timeout | undefined
  const ceiling = new Promise<TurnOutcome>(resolve => {
    timer = setTimeout(
      () => { resolve({ type: 'error', message: `the upstream query produced nothing for ${TURN_CEILING_MS}ms` }) },
      TURN_CEILING_MS
    )
    if (timer.unref) timer.unref()
  })
  return Promise.race([turn, ceiling]).finally(() => { if (timer) clearTimeout(timer) })
}

async function handleCompletion (req: http.IncomingMessage, res: http.ServerResponse, store: SessionStore) {
  const body = JSON.parse(await readBody(req)) as CompletionRequest
  const messages = body.messages ?? []
  const tools = body.tools ?? []
  const toolNames = tools.map(t => t.function.name)
  const model = body.model ?? 'sonnet'
  const id = `chatcmpl-${crypto.randomUUID()}`

  res.writeHead(200, {
    'content-type': 'text/event-stream',
    'cache-control': 'no-cache',
    connection: 'keep-alive'
  })
  const send = (payload: object) => {
    if (res.writableEnded || res.destroyed) return
    res.write(`data: ${JSON.stringify(payload)}\n\n`)
  }
  const sink = (text: string) => { send(textChunk(id, model, text)) }

  // The client can vanish mid-turn: the tab closes, or the UI's idle watchdog
  // aborts the fetch. Without this the conversation would stay in the store with
  // a claude subprocess alive, streaming into a dead socket.
  let active: Conversation | null = null
  res.on('close', () => {
    if (res.writableEnded) return
    if (active) store.delete(active.key)
  })

  // --- fast path: hand the tool results to the query that is waiting for them ---
  const continuation = continuationOf(messages)
  if (continuation) {
    const live = store.get(continuation.key) as Conversation | undefined
    if (live && !live.isDead && live.awaits(continuation.toolResults.map(r => r.id)) && sameToolSet(live.toolNames, toolNames)) {
      active = live
      live.lastSeen = Date.now()
      // The history has grown by this turn, so the NEXT continuation hashes
      // against it. rekey, never delete+set: delete aborts the query.
      store.rekey(continuation.key, hashMessages(messages))
      const turn = live.beginTurn(sink)
      live.deliverToolResults(continuation.toolResults)
      finish(await withCeiling(turn), live, store, res, send, id, model)
      return
    }
    // Diverged, expired, dead, answering calls this session never made, or
    // declaring a tool set the live query was not built with.
    if (live) store.delete(continuation.key)
  }

  // --- replay path: a fresh session carrying the whole history ---
  const key = hashMessages(messages)
  store.delete(key)
  const conv = new Conversation(key, toolNames)
  active = conv
  const toolServer = createToolServer(tools, (name, args) => conv.handleToolCall(name, args))
  const iterator = query({
    prompt: renderTranscript(messages),
    options: {
      ...isolationOptions(NEUTRAL_CWD),
      model,
      systemPrompt: extractSystemPrompt(messages),
      // The tool server deliberately holds the LOW-LEVEL MCP `Server` (see
      // tool-server.ts: the high-level `McpServer` helper rejects raw JSON
      // Schema, which is exactly what an OpenAI request hands us). The SDK's
      // config type names the helper; the two are wire-compatible, so the cast
      // keeps the deliberate choice while letting the file type-check.
      mcpServers: { [MCP_SERVER_NAME]: toolServer as unknown as McpServerConfig },
      allowedTools: tools.map(t => toolNameToMcp(t.function.name)),
      // Without this the SDK query is unabortable and every eviction — TTL, LRU,
      // divergence, client disconnect — would drop the map entry while leaving a
      // claude subprocess running.
      abortController: conv.controller
    }
  }) as AsyncIterable<SdkMessage>
  store.set(conv)
  finish(await withCeiling(conv.beginTurn(sink, iterator)), conv, store, res, send, id, model)
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
  if (res.writableEnded || res.destroyed) return
  res.write('data: [DONE]\n\n')
  res.end()
}
