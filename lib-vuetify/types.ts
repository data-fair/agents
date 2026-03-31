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

export type AgentChatMessage = AgentStatusMessage | AgentToolsChangedMessage | AgentUnreadMessage

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

/** BroadcastChannel message sent by drawer to announce presence */
export interface AgentChatReady {
  channel: string
  type: 'agent-chat-ready'
}

/** BroadcastChannel message sent by action buttons to discover drawer */
export interface AgentChatPing {
  channel: string
  type: 'agent-chat-ping'
}

/** BroadcastChannel message sent by drawer in response to ping */
export interface AgentChatPong {
  channel: string
  type: 'agent-chat-pong'
}

export type AgentActionMessage = AgentActionStartSession | AgentActionSessionCleared | AgentChatReady | AgentChatPing | AgentChatPong
