
export const schemaExports: string[]

// see https://github.com/bcherny/json-schema-to-typescript/issues/439 if some types are not exported
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
      "assistant" | "tools" | "summarizer" | "evaluator" | "moderator",
      ...("assistant" | "tools" | "summarizer" | "evaluator" | "moderator")[]
    ];
    multiplier?: number;
  }[];
  defaultModels?: {
    assistant?: ModelRef;
    tools?: ModelRef;
    summarizer?: ModelRef;
    evaluator?: ModelRef;
    moderator?: ModelRef;
  };
  outputTokenWeight: number;
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
  currency: string;
  requireAnonymousActionToken: boolean;
  evaluatorAccount?: {
    type: "user" | "organization";
    id: string;
  } | null;
  github?: {
    token?: string;
  };
  util?: unknown;
  get?: unknown;
  has?: unknown;
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
      