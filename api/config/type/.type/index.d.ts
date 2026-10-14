
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
 * Wall-clock ceiling for one chat turn, so a hanging model or MCP server cannot hold a conversation's lock. A planned task run has its own, taskTimeoutSeconds.
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
  /**
   * The servers of each built-in personal assistant: references into mcpServers, like a configured agent's. Unset: no catalog servers.
   */
  personalAssistants?: {
    portal?: {
      mcpServers?: {
        serverId: string;
        toolFilter?: string[];
      }[];
    };
    backOffice?: {
      mcpServers?: {
        serverId: string;
        toolFilter?: string[];
      }[];
    };
  };
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
  /**
   * The file store of autonomous agents (docs/architecture/agent-files.md). Unset: files are off.
   */
  files?: {
    storage: "fs" | "s3";
    /**
     * fs: a directory on a volume shared by every node when the service is scaled.
     */
    dataDir?: string;
    s3?: {
      region?: string;
      endpoint?: string;
      bucket?: string;
      credentials?: {
        accessKeyId?: string;
        secretAccessKey?: string;
      };
      forcePathStyle?: boolean;
    };
    /**
     * Signs the file URLs MCP servers fetch.
     */
    secret: string;
    /**
     * The agents API base URL as MCP servers reach it: what they configure as FILE_URL_PREFIXES.
     */
    publicUrl: string;
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
  /**
   * Wall-clock ceiling of one planned task's run. Longer than a chat turn's: nobody waits on it, and code mode and files make long runs the normal case.
   */
  taskTimeoutSeconds: number;
  /**
   * How many code_mode scripts this process runs at once (one QuickJS worker each, up to 64 MiB). A script started while all are busy is refused, not queued.
   */
  codeModeMaxWorkers: number;
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
      