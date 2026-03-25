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

/** BroadcastChannel message sent by action buttons */
export interface AgentActionStartSession {
  channel: string
  type: 'agent-start-session'
  visiblePrompt: string
  hiddenContext: string
}

/** BroadcastChannel message sent when action button is disposed */
export interface AgentActionSessionCleared {
  channel: string
  type: 'agent-session-cleared'
}

export type AgentActionMessage = AgentActionStartSession | AgentActionSessionCleared
