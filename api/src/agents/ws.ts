import { type ModelMessage, ToolLoopAgent, generateText, tool } from 'ai'
import type { Server } from 'node:http'
import { WebSocketServer, type WebSocket } from 'ws'
import { randomUUID } from 'crypto'
import { getEncoding } from 'js-tiktoken'
// import { session } from '@data-fair/lib-express'

let wss: WebSocketServer | undefined
const livingAgents: Record<string, AgentWsSocket> = {}
const encoding = getEncoding('cl100k_base') // Standard encoding for GPT-4/Claude

type PageAgentTool = {
  name: string;
  description: string;
  inputSchema: any;
}

function sanitizeToolName (name: string): string {
  return name
    .trim()
    .replace(/\s+/g, '_')           // Replace spaces with underscores
    .replace(/[^a-zA-Z0-9_-]/g, '') // Remove any illegal characters
    .substring(0, 64)              // Enforce length limits
}

function checkTools (tools) {
  for (const tool of tools) {
    if (tool.name !== sanitizeToolName(tool.name)) throw new Error('invalid tool name: ' + tool.name)
  }
}

export class AgentWsSocket {
  private pendingCalls = new Map<string, { resolve: (res: any) => void, timeout: NodeJS.Timeout }>()
  private agentTools: PageAgentTool[] = []
  private agent: ToolLoopAgent
  private history: ModelMessage[] = []
  public isAlive = true
  private status: 'handshake' | 'working' | 'ready' = 'handshake'

  constructor (public socket: WebSocket, public model: string) {
    this.setupSocketListeners()
    this.agent = this.createAgent()
  }

  private setupSocketListeners () {
    this.socket.on('message', async (data: any) => {
      const msg = JSON.parse(data)

      if (msg.type === 'init-state') {
        if (this.status !== 'handshake') throw new Error(`received a init-state message while in status ${this.status}`)
        checkTools(msg.tools)
        this.history = msg.history
        this.agentTools = msg.tools
        this.status = 'ready'
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
          const stream = await this.agent.stream({ messages: [...this.history, { role: 'user', content: msg.content }] })
          for await (const content of stream.textStream) {
            this.socket.send(JSON.stringify({ type: 'agent-output', content }))
          }
          const newMessages = (await stream.response).messages
          this.history = this.history.concat(newMessages)
          const compacted = await this.compactIfNeeded()
          if (compacted) {
            this.socket.send(JSON.stringify({ type: 'reset-history', history: this.history }))
          } else {
            this.socket.send(JSON.stringify({ type: 'push-history', history: newMessages }))
          }
          this.status = 'ready'
        }
      }
    })

    this.socket.once('close', () => {
      for (const [id, call] of this.pendingCalls) {
        clearTimeout(call.timeout)
        this.pendingCalls.delete(id)
      }
    })
  }

  public createAgent () {
    return new ToolLoopAgent({
      model: this.model,
      // The core of our "generic" agent: it generates tools on the fly
      prepareStep: async () => {
        const dynamicTools: Record<string, any> = {}

        this.agentTools.forEach((t) => {
          dynamicTools[t.name] = tool({
            description: t.description,
            inputSchema: t.inputSchema,
            execute: async (args) => this.callBrowserTool(t.name, args),
          })
        })

        return { tools: dynamicTools }
      },
    })
  }

  private async callBrowserTool (name: string, args: any) {
    const toolExists = this.agentTools.some(t => t.name === name)
    if (!toolExists) throw new Error(`attempted to call unknown/unauthorized tool: ${name}`)

    const callId = randomUUID()
    this.socket.send(JSON.stringify({ type: 'tool-call', name, args, callId }))

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
          model: this.model,
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
export const start = async (server: Server) => {
  wss = new WebSocketServer({ server })
  wss.on('connection', async (ws, req) => {
    // Associate ws connections to ids for subscriptions
    const clientId = randomUUID()
    // TODO: fetch settings / model for back-office assistant
    // const sessionState = await session.req(req)
    const agentWsSocket = livingAgents[clientId] = new AgentWsSocket(ws, 'mock-model')

    agentWsSocket.socket.on('close', () => {
      delete livingAgents[clientId]
    })

    agentWsSocket.socket.on('error', () => agentWsSocket.socket.terminate())

    agentWsSocket.socket.on('pong', () => {
      agentWsSocket.isAlive = true
    })
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
