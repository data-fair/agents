
export const schemaExports: string[]

export declare function validate(data: any): data is SettingsPut
export declare function assertValid(data: any, options?: import('@data-fair/lib-validation').AssertValidOptions): asserts data is SettingsPut
export declare function returnValid(data: any, options?: import('@data-fair/lib-validation').AssertValidOptions): SettingsPut
      
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
 * Multiplier applied to token usage for quota accounting (e.g. 1.0 = full cost, 0.5 = half cost)
 */
export type UsageRatio = number;
/**
 * Multiplier applied to token usage for quota accounting
 */
export type UsageRatio1 = number;
/**
 * Multiplier applied to token usage for quota accounting (e.g. 0.5 for cheaper summarization)
 */
export type UsageRatio2 = number;
/**
 * Multiplier applied to token usage for quota accounting
 */
export type UsageRatio3 = number;
export type Unlimited = boolean;
export type DailyTokenLimit = number;
export type MonthlyTokenLimit = number;

export type SettingsPut = {
  createdAt?: string;
  updatedAt?: string;
  owner?: {
    type: "user" | "organization";
    id: string;
    name?: string;
    department?: string;
  };
  providers: AIProviders;
  models: Models;
  quotas: RoleQuotas;
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
  assistant?: Assistant;
  tools?: Tools;
  summarizer?: Summarizer;
  evaluator?: Evaluator;
  [k: string]: unknown;
}
/**
 *
 * The primary conversational interface. Balanced for reasoning, instruction-following, and human-like interaction. This model manages the high-level flow and delegates complex tasks to subagents.
 *
 * Recommendations: GPT-5.4, Claude 4.5 Sonnet, Llama 4 Maverick, Mistral Large 3, etc.
 */
export type Assistant = {
  model?: Model;
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
 *
 * The "technician." Specialized in structured data and API interaction. It excels at chaining multiple tool calls without conversational filler, ensuring high reliability in automated workflows.
 *
 * Recommendations: GPT-5.4 Mini, Mistral DevStral, Claude 4.5 Sonnet (Computer Use), MiMo-V2-Flash, etc.
 */
export type Tools = {
  model?: Model1;
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
 *
 * A "shorthand" specialist. Optimized for quickly distilling key points from small-to-medium text blocks. It focuses on high information density and brevity to keep context windows lean and costs low.
 *
 * Recommendations: GPT-5.4 Mini, Claude 4.5 Haiku, Mistral Small 4, Llama 4 (8B), etc.
 */
export type Summarizer = {
  model?: Model2;
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
/**
 *
 * The "quality controller." Analyzes the assistant's logic and tool outputs for accuracy and safety. It requires the highest reasoning capabilities to act as a reliable ground truth for system performance.
 *
 * Recommendations: Claude Opus 4.6, GPT-5.4 (Reasoning), DeepSeek-R1, Pharia-1-LLM, etc.
 */
export type Evaluator = {
  model?: Model3;
  ratio?: UsageRatio3;
  [k: string]: unknown;
}
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
export type RoleQuotas = {
  global: GlobalQuotas;
  admin: AdminQuotas;
  contrib: ContributorQuotas;
  user: SimpleUserQuotas;
  external: ExternalUserQuotas;
  anonymous: AnonymousUserQuotas;
  [k: string]: unknown;
}
export type GlobalQuotas = {
  unlimited: Unlimited;
  dailyTokenLimit: DailyTokenLimit;
  monthlyTokenLimit: MonthlyTokenLimit;
  [k: string]: unknown;
}
export type AdminQuotas = {
  unlimited: Unlimited;
  dailyTokenLimit: DailyTokenLimit;
  monthlyTokenLimit: MonthlyTokenLimit;
  [k: string]: unknown;
}
export type ContributorQuotas = {
  unlimited: Unlimited;
  dailyTokenLimit: DailyTokenLimit;
  monthlyTokenLimit: MonthlyTokenLimit;
  [k: string]: unknown;
}
export type SimpleUserQuotas = {
  unlimited: Unlimited;
  dailyTokenLimit: DailyTokenLimit;
  monthlyTokenLimit: MonthlyTokenLimit;
  [k: string]: unknown;
}
export type ExternalUserQuotas = {
  unlimited: Unlimited;
  dailyTokenLimit: DailyTokenLimit;
  monthlyTokenLimit: MonthlyTokenLimit;
  [k: string]: unknown;
}
export type AnonymousUserQuotas = {
  unlimited: Unlimited;
  dailyTokenLimit: DailyTokenLimit;
  monthlyTokenLimit: MonthlyTokenLimit;
  [k: string]: unknown;
}
/**
 * This interface was referenced by `SettingsPut`'s JSON-Schema
 * via the `definition` "RoleQuota".
 */
export type RoleQuota = {
  unlimited: Unlimited;
  dailyTokenLimit: DailyTokenLimit;
  monthlyTokenLimit: MonthlyTokenLimit;
  [k: string]: unknown;
}
/**
 * This interface was referenced by `SettingsPut`'s JSON-Schema
 * via the `definition` "Model".
 */
export type Model4 = {
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

