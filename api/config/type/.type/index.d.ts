
export const schemaExports: string[]

// see https://github.com/bcherny/json-schema-to-typescript/issues/439 if some types are not exported
export type ApiConfig = {
  mongoUrl: string;
  port: number;
  tmpDir: string;
  privateDirectoryUrl: string;
  privateEventsUrl?: string;
  secretKeys: {
    admin: string;
    events?: string;
  };
  observer: {
    active?: boolean;
    port?: number;
    [k: string]: unknown;
  };
  upgradeRoot?: string;
  cipherPassword: string;
  util?: unknown;
  get?: unknown;
  has?: unknown;
}


export declare function validate(data: any): data is ApiConfig
export declare function assertValid(data: any, options?: import('@data-fair/lib-validation').AssertValidOptions): asserts data is ApiConfig
export declare function returnValid(data: any, options?: import('@data-fair/lib-validation').AssertValidOptions): ApiConfig
      