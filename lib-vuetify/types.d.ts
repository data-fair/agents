export type AgentStatus = 'idle' | 'working' | 'waiting-user' | 'error';
export interface AgentStatusMessage {
    type: 'agent-status';
    status: AgentStatus;
}
export interface AgentToolsChangedMessage {
    type: 'tools-changed';
}
export interface AgentUnreadMessage {
    type: 'unread';
    unread: boolean;
}
export type AgentChatMessage = AgentStatusMessage | AgentToolsChangedMessage | AgentUnreadMessage;
