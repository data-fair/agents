
export const schemaExports: string[]

export declare function validate(data: any): data is SettingsPut
export declare function assertValid(data: any, options?: import('@data-fair/lib-validation').AssertValidOptions): asserts data is SettingsPut
export declare function returnValid(data: any, options?: import('@data-fair/lib-validation').AssertValidOptions): SettingsPut
      
// see https://github.com/bcherny/json-schema-to-typescript/issues/439 if some types are not exported
/**
 * When enabled, conversations of consenting users are stored on the server for 30 days for admin review. Each user must explicitly accept.
 */
export type StoreConversationTraces = boolean;
export type Provider = OpenAI | Anthropic | Google | Mistral | OpenRouter | Ollama | Scaleway | OpenAICompatible | Mock;
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
export type ProviderType6 = "scaleway";
export type ProviderID6 = string;
export type DisplayName6 = string;
export type Enabled6 = boolean;
export type APIKey6 = string;
/**
 * Optional. The Scaleway Project ID (UUID) the API key is scoped to. Required when the key only has access to a specific project, otherwise model listing and inference return 403.
 */
export type ProjectID = string;
export type ProviderType7 = "openai-compatible";
export type ProviderID7 = string;
export type DisplayName7 = string;
export type Enabled7 = boolean;
export type BaseURL1 = string;
export type APIKey7 = string;
/**
 * Use "compatible" for providers that do not support the new /v1/responses endpoint (e.g. LiteLLM, older OpenAI-compatible APIs). Leave empty for standard OpenAI behavior.
 */
export type CompatibilityMode = "default" | "compatible";
export type ProviderType8 = "mock";
export type ProviderID8 = string;
export type DisplayName8 = string;
export type Enabled8 = boolean;
export type AIProviders = Provider[];
export type ModelID = string;
export type Name = string;
export type ProviderType9 = string;
export type ProviderName = string;
export type ProviderID9 = string;
export type InputPricePer1MTokens = number;
export type OutputPricePer1MTokens = number;
export type InputPricePer1MTokens1 = number;
export type OutputPricePer1MTokens1 = number;
export type InputPricePer1MTokens2 = number;
export type OutputPricePer1MTokens2 = number;
export type InputPricePer1MTokens3 = number;
export type OutputPricePer1MTokens3 = number;
export type InputPricePer1MTokens4 = number;
export type OutputPricePer1MTokens4 = number;
/**
 * When enabled, the last user message of each request from a moderated category is classified before the model responds.
 */
export type EnableInputModeration = boolean;
export type Anonymous = "anonymous";
export type External = "external";
export type User = "user";
export type Contributor = "contrib";
export type Admin = "admin";
/**
 * User categories whose requests are checked by the gate when moderation is enabled.
 */
export type ModeratedUserCategories = ((Anonymous | External | User | Contributor | Admin) & string)[];
export type Unlimited = boolean;
/**
 * Weekly limit = monthly / 2, daily limit = monthly / 4
 */
export type MonthlyLimit = number;

export type SettingsPut = {
  createdAt?: string;
  updatedAt?: string;
  storeTraces?: StoreConversationTraces;
  owner?: {
    type: "user" | "organization";
    id: string;
    name?: string;
    department?: string;
  };
  providers: AIProviders;
  models?: Models;
  moderation?: InputModeration;
  quotas?: RoleQuotas;
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
 * For an API key scoped to a specific Scaleway Project, set the Project ID so requests target that project. Leave it empty to use the organization default project.
 */
export type Scaleway = {
  type: ProviderType6;
  id: ProviderID6;
  name: DisplayName6;
  enabled: Enabled6;
  apiKey: APIKey6;
  projectId?: ProjectID;
  [k: string]: unknown;
}
/**
 * Generic provider for any OpenAI-compatible endpoint (Together, Fireworks, Groq, DeepInfra, vLLM, LM Studio, etc.). API Key is optional for unauthenticated local servers.
 */
export type OpenAICompatible = {
  type: ProviderType7;
  id: ProviderID7;
  name: DisplayName7;
  enabled: Enabled7;
  baseURL: BaseURL1;
  apiKey?: APIKey7;
  compatibility?: CompatibilityMode;
  [k: string]: unknown;
}
/**
 * To a message "hello" respond "world", to a message "call tool ARG1 ARG2" respond with a tool call, to anything else respond "what do you mean ?"
 */
export type Mock = {
  type: ProviderType8;
  id: ProviderID8;
  name: DisplayName8;
  enabled: Enabled8;
  [k: string]: unknown;
}
export type Models = {
  assistant?: Assistant;
  tools?: Tools;
  summarizer?: Summarizer;
  evaluator?: Evaluator;
  moderator?: Moderator;
  [k: string]: unknown;
}
/**
 *
 * The primary conversational interface. Balanced for reasoning, instruction-following, and human-like interaction. This model manages the high-level flow and delegates complex tasks to subagents.
 *
 * Recommendations: GPT-5.4, Claude 4.5 Sonnet, Kimi K2, Mistral Large 3, etc.
 */
export type Assistant = {
  model?: Model;
  inputPricePerMillion?: InputPricePer1MTokens;
  outputPricePerMillion?: OutputPricePer1MTokens;
  [k: string]: unknown;
}
export type Model = {
  id: ModelID;
  name: Name;
  provider: {
    type: ProviderType9;
    name: ProviderName;
    id: ProviderID9;
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
  inputPricePerMillion?: InputPricePer1MTokens1;
  outputPricePerMillion?: OutputPricePer1MTokens1;
  [k: string]: unknown;
}
export type Model1 = {
  id: ModelID;
  name: Name;
  provider: {
    type: ProviderType9;
    name: ProviderName;
    id: ProviderID9;
    [k: string]: unknown;
  };
  [k: string]: unknown;
}
/**
 *
 * A "shorthand" specialist. Optimized for quickly distilling key points from small-to-medium text blocks. It focuses on high information density and brevity to keep context windows lean and costs low.
 *
 * Recommendations: GPT-5.4 Mini, Claude 4.5 Haiku, Mistral Small 4, Qwen3 (8B), etc.
 */
export type Summarizer = {
  model?: Model2;
  inputPricePerMillion?: InputPricePer1MTokens2;
  outputPricePerMillion?: OutputPricePer1MTokens2;
  [k: string]: unknown;
}
export type Model2 = {
  id: ModelID;
  name: Name;
  provider: {
    type: ProviderType9;
    name: ProviderName;
    id: ProviderID9;
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
  inputPricePerMillion?: InputPricePer1MTokens3;
  outputPricePerMillion?: OutputPricePer1MTokens3;
  [k: string]: unknown;
}
export type Model3 = {
  id: ModelID;
  name: Name;
  provider: {
    type: ProviderType9;
    name: ProviderName;
    id: ProviderID9;
    [k: string]: unknown;
  };
  [k: string]: unknown;
}
/**
 *
 * The "gatekeeper." Classifies each new user message for profanity, prompt-injection, persona override, and out-of-scope requests. Should be fast and cheap — it sits on the critical path to the first response token.
 *
 * Recommendations: a small/fast general-purpose model with structured (JSON) output support, e.g. Claude 4.5 Haiku, GPT-5.4 Mini, Mistral Small 4, Qwen3 (4B). Dedicated moderation classifiers (Llama Guard, moderation APIs) are not compatible: they use fixed taxonomies and output formats that cannot express this platform's custom policy. Avoid reasoning ("thinking") models: the verdict is capped at a small token budget and a short latency window, both of which a reasoning model spends on hidden reasoning instead of the JSON verdict — it then returns nothing usable in time and moderation silently fails open (every message is allowed).
 */
export type Moderator = {
  model?: Model4;
  inputPricePerMillion?: InputPricePer1MTokens4;
  outputPricePerMillion?: OutputPricePer1MTokens4;
  [k: string]: unknown;
}
export type Model4 = {
  id: ModelID;
  name: Name;
  provider: {
    type: ProviderType9;
    name: ProviderName;
    id: ProviderID9;
    [k: string]: unknown;
  };
  [k: string]: unknown;
}
export type InputModeration = {
  enabled: EnableInputModeration;
  categories: ModeratedUserCategories;
}
export type RoleQuotas = {
  global: GlobalQuotas;
  admin: AdminQuotas;
  contrib: ContributorQuotas;
  user: SimpleUserQuotas;
  external: ExternalUserQuotas;
  anonymous: AnonymousUserQuotas;
  untrusted?: AnonymousExternalPool;
  [k: string]: unknown;
}
export type GlobalQuotas = {
  unlimited: Unlimited;
  monthlyLimit: MonthlyLimit;
  [k: string]: unknown;
}
export type AdminQuotas = {
  unlimited: Unlimited;
  monthlyLimit: MonthlyLimit;
  [k: string]: unknown;
}
export type ContributorQuotas = {
  unlimited: Unlimited;
  monthlyLimit: MonthlyLimit;
  [k: string]: unknown;
}
export type SimpleUserQuotas = {
  unlimited: Unlimited;
  monthlyLimit: MonthlyLimit;
  [k: string]: unknown;
}
export type ExternalUserQuotas = {
  unlimited: Unlimited;
  monthlyLimit: MonthlyLimit;
  [k: string]: unknown;
}
export type AnonymousUserQuotas = {
  unlimited: Unlimited;
  monthlyLimit: MonthlyLimit;
  [k: string]: unknown;
}
/**
 * Aggregate cap shared by all anonymous and external usage combined, so untrusted traffic cannot consume the whole account budget. 0 = no pool cap.
 */
export type AnonymousExternalPool = {
  unlimited: Unlimited;
  monthlyLimit: MonthlyLimit;
  [k: string]: unknown;
}
/**
 * This interface was referenced by `SettingsPut`'s JSON-Schema
 * via the `definition` "RoleQuota".
 */
export type RoleQuota = {
  unlimited: Unlimited;
  monthlyLimit: MonthlyLimit;
  [k: string]: unknown;
}
/**
 * This interface was referenced by `SettingsPut`'s JSON-Schema
 * via the `definition` "Model".
 */
export type Model5 = {
  id: ModelID;
  name: Name;
  provider: {
    type: ProviderType9;
    name: ProviderName;
    id: ProviderID9;
    [k: string]: unknown;
  };
  [k: string]: unknown;
}

