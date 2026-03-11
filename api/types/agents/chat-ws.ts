import type { ModelMessage } from 'ai'

export type PageAgentTool = {
  name: string
  description: string
  inputSchema: any
}

export type ChatWsClientMessage =
  | { type: 'init-state'; history: ModelMessage[]; tools: PageAgentTool[] }
  | { type: 'update-tools'; tools: PageAgentTool[] }
  | { type: 'tool-result'; callId: string; result: any }
  | { type: 'user-input'; content: string }

export type ChatWsServerMessage =
  | { type: 'init-state-ok' }
  | { type: 'tool-call'; name: string; args: any; callId: string }
  | { type: 'agent-output'; content: string }
  | { type: 'reset-history'; history: ModelMessage[] }
  | { type: 'push-history'; history: ModelMessage[] }

export type ChatWsMessage = ChatWsClientMessage | ChatWsServerMessage
