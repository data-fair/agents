
export const schemaExports: string[]

export declare function validate(data: any): data is ListSettingsReq
export declare function assertValid(data: any, options?: import('@data-fair/lib-validation').AssertValidOptions): asserts data is ListSettingsReq
export declare function returnValid(data: any, options?: import('@data-fair/lib-validation').AssertValidOptions): ListSettingsReq
      
// see https://github.com/bcherny/json-schema-to-typescript/issues/439 if some types are not exported
export type ListSettingsReq = {
  query: {
    _id?: string;
    createdAt?: string;
    updatedAt?: string;
    owner?: {
      type?: "user" | "organization";
      id?: string;
      name?: string;
      department?: string;
    };
    globalPrompt?: string;
  };
  [k: string]: unknown;
}

