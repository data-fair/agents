
export const schemaExports: string[]

// see https://github.com/bcherny/json-schema-to-typescript/issues/439 if some types are not exported
export type Provider = OpenAI | Anthropic | Google | Mistral | OpenRouter | Ollama | Mock;
export type ProviderType = "openai";
export type ProviderID = string;
export type DisplayName = string;
export type Enabled = boolean;
export type APIKey = string;
export type ProviderType1 = "anthropic";
export type ProviderID1 = string;
export type DisplayName1 = string;
export type Enabled1 = boolean;
export type APIKey1 = string;
export type ProviderType2 = "google";
export type ProviderID2 = string;
export type DisplayName2 = string;
export type Enabled2 = boolean;
export type APIKey2 = string;
export type ProviderType3 = "mistral";
export type ProviderID3 = string;
export type DisplayName3 = string;
export type Enabled3 = boolean;
export type APIKey3 = string;
export type ProviderType4 = "openrouter";
export type ProviderID4 = string;
export type DisplayName4 = string;
export type Enabled4 = boolean;
export type APIKey4 = string;
export type ProviderType5 = "ollama";
export type ProviderID5 = string;
export type DisplayName5 = string;
export type Enabled5 = boolean;
export type APIKey5 = string;
export type BaseURL = string;
export type ProviderType6 = "mock";
export type ProviderID6 = string;
export type DisplayName6 = string;
export type Enabled6 = boolean;
export type AIProviders = Provider[];
export type ModelID = string;
export type Name = string;
export type ProviderType7 = string;
export type ProviderName = string;
export type ProviderID7 = string;
/**
 * Roles allowed to use this model through the gateway (empty = admin only)
 */
export type Roles = string[];
/**
 * Multiplier applied to token usage for quota accounting (e.g. 1.0 = full cost, 0.5 = half cost)
 */
export type UsageRatio = number;
/**
 * Roles allowed to use this model through the gateway (empty = admin only)
 */
export type Roles1 = string[];
/**
 * Multiplier applied to token usage for quota accounting (e.g. 0.5 for cheaper summarization)
 */
export type UsageRatio1 = number;
/**
 * Roles allowed to use this model through the gateway (empty = admin only)
 */
export type Roles2 = string[];
/**
 * Multiplier applied to token usage for quota accounting
 */
export type UsageRatio2 = number;
/**
 * Maximum number of tokens allowed per day (0 for unlimited)
 */
export type DailyTokenLimit = number;
/**
 * Maximum number of tokens allowed per month (0 for unlimited)
 */
export type MonthlyTokenLimit = number;
/**
 * Maximum number of tokens allowed per day (0 for unlimited)
 */
export type DailyTokenLimit1 = number;
/**
 * Maximum number of tokens allowed per month (0 for unlimited)
 */
export type MonthlyTokenLimit1 = number;

export type Settings = {
  createdAt?: string;
  updatedAt?: string;
  owner: {
    type: "user" | "organization";
    id: string;
    name?: string;
    department?: string;
  };
  providers: AIProviders;
  models: Models;
  limits: UsageLimits;
  userLimits?: PerUserUsageLimits;
}
export type OpenAI = {
  type: ProviderType;
  id: ProviderID;
  name: DisplayName;
  enabled: Enabled;
  apiKey?: APIKey;
  [k: string]: unknown;
}
export type Anthropic = {
  type: ProviderType1;
  id: ProviderID1;
  name: DisplayName1;
  enabled: Enabled1;
  apiKey?: APIKey1;
  [k: string]: unknown;
}
export type Google = {
  type: ProviderType2;
  id: ProviderID2;
  name: DisplayName2;
  enabled: Enabled2;
  apiKey?: APIKey2;
  [k: string]: unknown;
}
export type Mistral = {
  type: ProviderType3;
  id: ProviderID3;
  name: DisplayName3;
  enabled: Enabled3;
  apiKey?: APIKey3;
  [k: string]: unknown;
}
export type OpenRouter = {
  type: ProviderType4;
  id: ProviderID4;
  name: DisplayName4;
  enabled: Enabled4;
  apiKey?: APIKey4;
  [k: string]: unknown;
}
export type Ollama = {
  type: ProviderType5;
  id: ProviderID5;
  name: DisplayName5;
  enabled: Enabled5;
  apiKey?: APIKey5;
  baseURL: BaseURL;
  [k: string]: unknown;
}
/**
 * To a message "hello" respond "world", to a message "call tool ARG1 ARG2" respond with a tool call, to anything else respond "what do you mean ?"
 */
export type Mock = {
  type: ProviderType6;
  id: ProviderID6;
  name: DisplayName6;
  enabled: Enabled6;
  [k: string]: unknown;
}
export type Models = {
  assistant: Assistant;
  summarizer?: Summarizer;
  evaluator?: Evaluator;
  [k: string]: unknown;
}
/**
 * Main conversational model. Suggested models: claude-3-5-haiku, gpt-4o-mini, gemini-2.0-flash, mistral-small-latest, minimax-01.
 */
export type Assistant = {
  model?: Model;
  roles?: Roles;
  ratio?: UsageRatio;
  [k: string]: unknown;
}
export type Model = {
  id: ModelID;
  name: Name;
  provider: {
    type: ProviderType7;
    name: ProviderName;
    id: ProviderID7;
    [k: string]: unknown;
  };
  [k: string]: unknown;
}
/**
 * Model used for chat history summarization (optional, defaults to assistant). Suggested models: claude-3-5-haiku, gpt-4o-mini, gemini-2.0-flash-lite, mistral-small-latest.
 */
export type Summarizer = {
  model?: Model1;
  roles?: Roles1;
  ratio?: UsageRatio1;
  [k: string]: unknown;
}
export type Model1 = {
  id: ModelID;
  name: Name;
  provider: {
    type: ProviderType7;
    name: ProviderName;
    id: ProviderID7;
    [k: string]: unknown;
  };
  [k: string]: unknown;
}
/**
 * Model used for evaluation tasks (optional, defaults to assistant). Suggested models: claude-3-5-haiku, gpt-4o-mini, gemini-2.0-flash, mistral-small-latest.
 */
export type Evaluator = {
  model?: Model2;
  roles?: Roles2;
  ratio?: UsageRatio2;
  [k: string]: unknown;
}
export type Model2 = {
  id: ModelID;
  name: Name;
  provider: {
    type: ProviderType7;
    name: ProviderName;
    id: ProviderID7;
    [k: string]: unknown;
  };
  [k: string]: unknown;
}
export type UsageLimits = {
  dailyTokenLimit: DailyTokenLimit;
  monthlyTokenLimit: MonthlyTokenLimit;
  [k: string]: unknown;
}
export type PerUserUsageLimits = {
  dailyTokenLimit: DailyTokenLimit1;
  monthlyTokenLimit: MonthlyTokenLimit1;
  [k: string]: unknown;
}
/**
 * This interface was referenced by `Settings`'s JSON-Schema
 * via the `definition` "Model".
 */
export type Model3 = {
  id: ModelID;
  name: Name;
  provider: {
    type: ProviderType7;
    name: ProviderName;
    id: ProviderID7;
    [k: string]: unknown;
  };
  [k: string]: unknown;
}

