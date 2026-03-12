import { type LanguageModel, type ModelMessage, type Tool, ToolLoopAgent, generateText, tool } from 'ai'
import type { Server } from 'node:http'
import { WebSocketServer, type WebSocket } from 'ws'
import { randomUUID } from 'crypto'
import { getEncoding } from 'js-tiktoken'
import { match } from 'path-to-regexp'
import type { PageAgentTool, ChatWsServerMessage } from '#types'
import { assertAccountRole, session, type SessionStateAuthenticated } from '@data-fair/lib-express/index.js'
import mongo from '#mongo'
import { createTraceIntegration } from '../traces/trace-integration.ts'
import { getRawSettings } from '../settings/service.ts'
import { createModel } from '../models/operations.ts'
import { internalError } from '@data-fair/lib-node/observer.js'

let wss: WebSocketServer | undefined
const livingAgents: Record<string, AgentWsSocket> = {}
const encoding = getEncoding('cl100k_base') // Standard encoding for GPT-4/Claude

function sanitizeToolName (name: string): string {
  return name
    .trim()
    .replace(/\s+/g, '_')           // Replace spaces with underscores
    .replace(/[^a-zA-Z0-9_-]/g, '') // Remove any illegal characters
    .substring(0, 64)              // Enforce length limits
}

function checkTools (tools: PageAgentTool[]) {
  for (const tool of tools) {
    if (tool.name !== sanitizeToolName(tool.name)) throw new Error('invalid tool name: ' + tool.name)
  }
}

export class AgentWsSocket {
  private pendingCalls = new Map<string, { resolve: (res: any) => void, timeout: NodeJS.Timeout }>()
  private agentTools: PageAgentTool[] = []
  private history: ModelMessage[] = []
  public isAlive = true
  private status: 'handshake' | 'working' | 'ready' = 'handshake'
  public socket: WebSocket
  private model: LanguageModel
  private summaryModel: LanguageModel
  private sessionState: SessionStateAuthenticated
  private traceEnabled = false
  private traceId: string | undefined
  private traceIntegration: ReturnType<typeof createTraceIntegration> | undefined

  constructor (socket: WebSocket, sessionState: SessionStateAuthenticated, model: LanguageModel, summaryModel: LanguageModel) {
    this.socket = socket
    this.model = model
    this.summaryModel = summaryModel
    this.sessionState = sessionState
    this.setupSocketListeners()
  }

  private send (msg: ChatWsServerMessage) {
    this.socket.send(JSON.stringify(msg))
  }

  private setupSocketListeners () {
    console.log('setup listener')
    this.socket.on('message', async (data: any) => {
      try {
        const msg = JSON.parse(data)

        if (msg.type === 'init-state') {
          if (this.status !== 'handshake') throw new Error(`received a init-state message while in status ${this.status}`)
          checkTools(msg.tools)
          this.history = msg.history
          this.agentTools = msg.tools

          // Handle tracing
          this.traceEnabled = msg.trace || false
          if (this.traceEnabled) {
            this.traceId = msg.traceId || randomUUID()
            this.traceIntegration = createTraceIntegration(this.sessionState.user.id, mongo.db.collection('traces'), this.traceId)
          }

          this.status = 'ready'
          this.send({ type: 'init-state-ok', traceId: this.traceId })
        } else {
          if (msg.type === 'update-tools') {
            checkTools(msg.tools)
            this.agentTools = msg.tools
          } else if (msg.type === 'tool-result') {
            const pendingCall = this.pendingCalls.get(msg.callId)
            if (!pendingCall) throw new Error('received a tool-result without a matching pending call')
            pendingCall.resolve(msg.result)
            clearTimeout(pendingCall.timeout)
            this.pendingCalls.delete(msg.callId)
          } else if (msg.type === 'user-input') {
            if (this.status !== 'ready') throw new Error(`received a user-input message while in status ${this.status}`)
            this.status = 'working'
            const stream = await this.createAgent().stream({ messages: [...this.history, { role: 'user', content: msg.content }] })
            for await (const content of stream.textStream) {
              this.send({ type: 'agent-output', content })
            }
            const newMessages = (await stream.response).messages
            this.history = this.history.concat(newMessages)
            const compacted = await this.compactIfNeeded()
            if (compacted) {
              this.send({ type: 'reset-history', history: this.history })
            } else {
              this.send({ type: 'push-history', history: newMessages })
            }
            this.status = 'ready'
          }
        }
      } catch (err: any) {
        internalError('chat-ws', err)
        this.socket.close(500, err.message)
      }
    })

    this.socket.once('close', () => {
      for (const [id, call] of this.pendingCalls) {
        clearTimeout(call.timeout)
        this.pendingCalls.delete(id)
      }
    })

    this.send({ type: 'ready' })
  }

  public createAgent () {
    // The core of our "generic" WebMCP agent: it generates tools on the fly
    const tools: Record<string, Tool> = {}

    this.agentTools.forEach((t) => {
      tools[t.name] = tool({
        description: t.description,
        inputSchema: t.inputSchema,
        execute: async (args) => this.callBrowserTool(t.name, args),
      })
    })

    if (this.traceEnabled && this.traceId && this.traceIntegration) {
      return new ToolLoopAgent({
        model: this.model,
        tools,
        experimental_telemetry: {
          isEnabled: true,
          functionId: this.traceId,
          metadata: {
            traceId: this.traceId,
            userId: this.sessionState.user.id
          },
          integrations: [this.traceIntegration]
        }
      })
    }

    return new ToolLoopAgent({ model: this.model, tools })
  }

  private async callBrowserTool (name: string, args: any) {
    const toolExists = this.agentTools.some(t => t.name === name)
    if (!toolExists) throw new Error(`attempted to call unknown/unauthorized tool: ${name}`)

    const callId = randomUUID()
    this.send({ type: 'tool-call', name, args, callId })

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('WebMCP Timeout'))
        this.pendingCalls.delete(callId)
      }, 15000)

      this.pendingCalls.set(callId, { resolve, timeout })
    })
  }

  private countTokens (messages: ModelMessage[]): number {
    // A simple approximation: sum the content of all messages
    return messages.reduce((acc, m) => {
      const content = typeof m.content === 'string' ? m.content : JSON.stringify(m.content)
      return acc + encoding.encode(content).length
    }, 0)
  }

  private async compactIfNeeded () {
    const currentTokens = this.countTokens(this.history)

    // Only summarize if we are over the limit
    if (currentTokens > 4000) {
      console.log(`Compacting history: ${currentTokens} tokens found.`)

      // Keep the most recent 20% of tokens as "hot" context
      // and summarize the oldest 80%
      const splitIndex = Math.floor(this.history.length * 0.7)
      const toSummarize = this.history.slice(0, splitIndex)
      const toKeep = this.history.slice(splitIndex)

      try {
        const { text } = await generateText({
          model: this.summaryModel,
          system: 'Summarize the key outcomes and state of this chat so far.',
          messages: toSummarize,
        })

        this.history = [
          { role: 'system', content: `Previous context summary: ${text}` },
          ...toKeep
        ]
        return true
      } catch (e) {
        // Emergency fallback: If summarization fails, we must drop old messages
        // to prevent an 413 Request Entity Too Large error or OOM.
        this.history = toKeep
        return true
      }
    }
  }
}

let stopped = false
let pingInterval: ReturnType<typeof setInterval> | null = null
const chatPathMatcher = match('{/agents}/api/chat')
export const start = async (server: Server) => {
  wss = new WebSocketServer({ server })
  wss.on('connection', async (ws, req) => {
    try {
      const url = req.url || ''
      const matchResult = chatPathMatcher(url)
      if (!matchResult) {
        ws.close(4000, 'Invalid path')
        return
      }

      const sessionState = await session.reqAuthenticated(req)
      const owner = sessionState.account
      assertAccountRole(sessionState, owner, 'admin')

      const settings = await getRawSettings(owner)

      if (!settings?.chatModel) {
        ws.close(404, 'Chat model not configured')
        return
      }

      const modelConfig = settings.chatModel

      const provider = settings.providers.find(p => p.id === modelConfig.provider.id)

      if (!provider) {
        ws.close(400, 'Provider not configured')
        return
      }

      if (!provider.enabled) {
        ws.close(400, 'Provider is disabled')
        return
      }

      const aiModel = createModel(provider, modelConfig.id)

      const summaryModelConfig = settings.summaryModel || settings.chatModel
      const summaryProvider = settings.providers.find(p => p.id === summaryModelConfig.provider.id)
      if (!summaryProvider) {
        ws.close(400, 'Summary provider not configured')
        return
      }
      if (!summaryProvider.enabled) {
        ws.close(400, 'Summary provider is disabled')
        return
      }
      const summaryModel = createModel(summaryProvider, summaryModelConfig.id)

      const clientId = randomUUID()
      const agentWsSocket = livingAgents[clientId] = new AgentWsSocket(ws, sessionState, aiModel, summaryModel)

      agentWsSocket.socket.on('close', () => {
        delete livingAgents[clientId]
      })

      agentWsSocket.socket.on('error', () => agentWsSocket.socket.terminate())

      agentWsSocket.socket.on('pong', () => {
        agentWsSocket.isAlive = true
      })
    } catch (error) {
      console.error('WebSocket connection error:', error)
      ws.close(401, 'Authentication failed')
    }
  })

  // standard ping/pong used to detect lost connections
  pingInterval = setInterval(function ping () {
    if (stopped || !wss) return
    for (const agentWsSocket of Object.values(livingAgents)) {
      if (agentWsSocket.isAlive === false) { agentWsSocket.socket.terminate(); continue }
      agentWsSocket.isAlive = false
      agentWsSocket.socket.ping('', false, () => {})
    }
  }, 30000)
}

export const stop = async () => {
  if (wss) wss.close()
  stopped = true
  if (pingInterval) clearInterval(pingInterval)
}
