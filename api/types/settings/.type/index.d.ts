
export const schemaExports: string[]

// see https://github.com/bcherny/json-schema-to-typescript/issues/439 if some types are not exported
export type Provider = OpenAI | Anthropic | Google | Mistral | OpenRouter | Ollama;
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
export type AIProviders = Provider[];
export type Name = string;
/**
 * In this prompt you can instruct your assistant to behave in certain ways.
 */
export type MainPrompt = string;
/**
 * TODO: provide a list of models well-suited for this agent.
 */
export type ModeleIA = string;

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
  agents: Agents;
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
export type Agents = {
  backOfficeAssistant?: {
    name: Name;
    prompt: MainPrompt;
    model: ModeleIA;
    [k: string]: unknown;
  };
  [k: string]: unknown;
}

