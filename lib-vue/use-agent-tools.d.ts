export type AgentTool = Parameters<typeof navigator.modelContext.registerTool>[0];
export declare function useAgentTool(agentTool: AgentTool): void;
