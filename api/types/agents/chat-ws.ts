import type { ModelMessage } from 'ai'

export type PageAgentTool = {
  name: string
  description: string
  inputSchema: any
}

export type ChatWsClientMessage =
  | { type: 'init-state'; history: ModelMessage[]; tools: PageAgentTool[]; trace?: boolean; traceId?: string }
  | { type: 'update-tools'; tools: PageAgentTool[] }
  | { type: 'tool-result'; callId: string; result: any }
  | { type: 'user-input'; content: string }

export type ChatWsServerMessage =
  | { type: 'init-state-ok'; traceId?: string }
  | { type: 'tool-call'; name: string; args: any; callId: string }
  | { type: 'agent-output'; content: string }
  | { type: 'reset-history'; history: ModelMessage[] }
  | { type: 'push-history'; history: ModelMessage[] }
  | { type: 'ready' }

export type ChatWsMessage = ChatWsClientMessage | ChatWsServerMessage
