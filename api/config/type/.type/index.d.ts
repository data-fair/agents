
export const schemaExports: string[]

// see https://github.com/bcherny/json-schema-to-typescript/issues/439 if some types are not exported
/**
 * Share of the assistant model's context window above which conversation history is compacted.
 */
export type CompactionPercent = number;
/**
 * Credits one turn may spend before it is stopped — any turn, the chat's as well as an autonomous agent's. The account credit cap still applies on top of this.
 */
export type TurnCreditBudget = number;
/**
 * Wall-clock ceiling for one turn, so a hanging model or MCP server cannot hold a conversation's lock.
 */
export type TurnTimeoutSeconds = number;
/**
 * On SIGTERM, how long running turns are given to finish before they are stopped as 'the server restarted'. The pod's terminationGracePeriodSeconds must exceed it.
 */
export type ShutdownGraceSeconds = number;

export type ApiConfig = {
  mongoUrl: string;
  port: number;
  tmpDir: string;
  privateDirectoryUrl: string;
  privateEventsUrl?: string;
  secretKeys: {
    events?: string;
    limits?: string;
  };
  providers?: {
    type:
      | "openai"
      | "anthropic"
      | "google"
      | "mistral"
      | "openrouter"
      | "ollama"
      | "scaleway"
      | "openai-compatible"
      | "mock";
    id: string;
    name: string;
    enabled?: boolean;
    apiKey?: string;
    baseURL?: string;
    projectId?: string;
    compatibility?: "default" | "compatible";
  }[];
  models?: {
    id: string;
    name: string;
    provider: string;
    /**
     * @minItems 1
     */
    usage: [
      "assistant" | "tools" | "summarizer" | "moderator",
      ...("assistant" | "tools" | "summarizer" | "moderator")[]
    ];
    contextWindow?: number;
    inputPricePerMillion: number;
    outputPricePerMillion: number;
    cachedInputPricePerMillion?: number;
  }[];
  mcpServers?: {
    id: string;
    name: string;
    description?: string;
    url: string;
    auth: "nhi-session" | "none" | "apiKey";
    apiKeyHeader?: string;
    apiKey?: string;
  }[];
  autonomousAgentsRequireAdminMode?: boolean;
  tasks: {
    /**
     * A task schedule may not fire more often than this.
     */
    minIntervalSeconds: number;
    /**
     * Planned tasks one autonomous agent may hold.
     */
    maxPerAgent: number;
    /**
     * How often the scheduler looks for due tasks.
     */
    pollSeconds: number;
    /**
     * Failed runs in a row after which a task is paused.
     */
    maxConsecutiveFailures: number;
  };
  nhiSigningKey?: {
    kty: string;
    crv: string;
    x: string;
    y: string;
    d: string;
    kid: string;
    alg?: string;
    [k: string]: unknown;
  };
  defaultModels?: {
    assistant?: ModelRef;
    tools?: ModelRef;
    summarizer?: ModelRef;
    moderator?: ModelRef;
  };
  eurosPerCredit: number;
  defaultLimits: {
    credits?: number;
  };
  observer: {
    active?: boolean;
    port?: number;
    [k: string]: unknown;
  };
  upgradeRoot?: string;
  cipherPassword: string;
  requireAnonymousActionToken: boolean;
  util?: unknown;
  get?: unknown;
  has?: unknown;
  compactionPercent: CompactionPercent;
  turnCredits: TurnCreditBudget;
  turnTimeoutSeconds: TurnTimeoutSeconds;
  shutdownGraceSeconds: ShutdownGraceSeconds;
}
/**
 * This interface was referenced by `ApiConfig`'s JSON-Schema
 * via the `definition` "modelRef".
 */
export type ModelRef = {
  provider: string;
  id: string;
}


export declare function validate(data: any): data is ApiConfig
export declare function assertValid(data: any, options?: import('@data-fair/lib-validation').AssertValidOptions): asserts data is ApiConfig
export declare function returnValid(data: any, options?: import('@data-fair/lib-validation').AssertValidOptions): ApiConfig
      