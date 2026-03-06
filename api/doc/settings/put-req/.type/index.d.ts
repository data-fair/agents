
export const schemaExports: string[]

export declare function validate(data: any): data is SettingsPut
export declare function assertValid(data: any, options?: import('@data-fair/lib-validation').AssertValidOptions): asserts data is SettingsPut
export declare function returnValid(data: any, options?: import('@data-fair/lib-validation').AssertValidOptions): SettingsPut
      
// see https://github.com/bcherny/json-schema-to-typescript/issues/439 if some types are not exported
export type Provider = OpenAI;
export type ProviderType = "openai";
export type ProviderID = string;
export type DisplayName = string;
export type Enabled = boolean;
export type APIKey = string;
export type AIProviders = Provider[];

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
}
export type OpenAI = {
  type: ProviderType;
  id: ProviderID;
  name: DisplayName;
  enabled: Enabled;
  apiKey?: APIKey;
  [k: string]: unknown;
}

