
export const schemaExports: string[]

export declare function validate(data: any): data is PutSettingsReq
export declare function assertValid(data: any, options?: import('@data-fair/lib-validation').AssertValidOptions): asserts data is PutSettingsReq
export declare function returnValid(data: any, options?: import('@data-fair/lib-validation').AssertValidOptions): PutSettingsReq
      
// see https://github.com/bcherny/json-schema-to-typescript/issues/439 if some types are not exported
/**
 * This prompt will be injected into all AI agents for this account
 */
export type GlobalPrompt = string;
export type ProviderID = string;
export type ProviderType = "openai" | "anthropic" | "google" | "mistral" | "openrouter" | "ollama" | "custom";
export type DisplayName = string;
export type Enabled = boolean;
export type APIKey = string;
export type OrganizationID = string;
export type ProjectID = string;
export type DefaultModel = string;
export type APIKey1 = string;
export type DefaultModel1 = string;
export type APIKey2 = string;
export type ProjectID1 = string;
export type Location = string;
export type DefaultModel2 = string;
export type APIKey3 = string;
export type DefaultModel3 = string;
export type APIKey4 = string;
export type DefaultModel4 = string;
export type BaseURL = string;
export type DefaultModel5 = string;
export type ProviderName = string;
export type BaseURL1 = string;
export type APIKey5 = string;
export type DefaultModel6 = string;
export type AIProviders = Provider[];

export type PutSettingsReq = {
  body: SettingsPut;
  query: {};
  [k: string]: unknown;
}
export type SettingsPut = {
  globalPrompt?: GlobalPrompt;
  providers: AIProviders;
}
export type Provider = {
  id?: ProviderID;
  type: ProviderType;
  name?: DisplayName;
  enabled?: Enabled;
  openai?: OpenAIConfiguration;
  anthropic?: AnthropicConfiguration;
  google?: GoogleAIConfiguration;
  mistral?: MistralAIConfiguration;
  openrouter?: OpenRouterConfiguration;
  ollama?: OllamaConfiguration;
  custom?: CustomProvider;
}
export type OpenAIConfiguration = {
  apiKey?: APIKey;
  organization?: OrganizationID;
  project?: ProjectID;
  defaultModel?: DefaultModel;
  [k: string]: unknown;
}
export type AnthropicConfiguration = {
  apiKey?: APIKey1;
  defaultModel?: DefaultModel1;
  [k: string]: unknown;
}
export type GoogleAIConfiguration = {
  apiKey?: APIKey2;
  project?: ProjectID1;
  location?: Location;
  defaultModel?: DefaultModel2;
  [k: string]: unknown;
}
export type MistralAIConfiguration = {
  apiKey?: APIKey3;
  defaultModel?: DefaultModel3;
  [k: string]: unknown;
}
export type OpenRouterConfiguration = {
  apiKey?: APIKey4;
  defaultModel?: DefaultModel4;
  [k: string]: unknown;
}
export type OllamaConfiguration = {
  baseURL?: BaseURL;
  defaultModel?: DefaultModel5;
  [k: string]: unknown;
}
export type CustomProvider = {
  name: ProviderName;
  baseURL: BaseURL1;
  apiKey?: APIKey5;
  defaultModel?: DefaultModel6;
  [k: string]: unknown;
}

