
export const schemaExports: string[]

export declare function validate(data: any): data is Settings
export declare function assertValid(data: any, options?: import('@data-fair/lib-validation').AssertValidOptions): asserts data is Settings
export declare function returnValid(data: any, options?: import('@data-fair/lib-validation').AssertValidOptions): Settings
      
// see https://github.com/bcherny/json-schema-to-typescript/issues/439 if some types are not exported
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
/**
 * @minItems 1
 */
export type AppropriateUsages = [
  (Assistant | Tools | Summarizer | Evaluator | Moderator) &
    string &
    (Assistant | Tools | Summarizer | Evaluator | Moderator) &
    string,
  ...((Assistant | Tools | Summarizer | Evaluator | Moderator) &
    string &
    (Assistant | Tools | Summarizer | Evaluator | Moderator) &
    string)[]
];
export type Assistant = "assistant";
export type Tools = "tools";
export type Summarizer = "summarizer";
export type Evaluator = "evaluator";
export type Moderator = "moderator";
/**
 * credits = (input tokens + output tokens × output weight) / 1M × multiplier
 */
export type CreditMultiplier = number;
export type Models = {
  model: Model;
  usage: AppropriateUsages;
  multiplier?: CreditMultiplier;
}[];

export type Settings = {
  providers?: AIProviders;
  models?: Models;
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
 * This interface was referenced by `Settings`'s JSON-Schema
 * via the `definition` "Model".
 */
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

