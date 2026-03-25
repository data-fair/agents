export type AgentStatus = 'idle' | 'working' | 'waiting-user' | 'error'

export interface AgentStatusMessage {
  type: 'agent-status'
  status: AgentStatus
}

export interface AgentToolsChangedMessage {
  type: 'tools-changed'
}

export interface AgentUnreadMessage {
  type: 'unread'
  unread: boolean
}

export interface ChatReadyMessage {
  type: 'chat-ready'
}

export interface StartSessionMessage {
  type: 'start-session'
  visiblePrompt: string
  hiddenContext: string
}

export interface SessionClearedMessage {
  type: 'session-cleared'
}

export type AgentChatMessage = AgentStatusMessage | AgentToolsChangedMessage | AgentUnreadMessage | ChatReadyMessage

export type ParentToIframeMessage = StartSessionMessage | SessionClearedMessage
