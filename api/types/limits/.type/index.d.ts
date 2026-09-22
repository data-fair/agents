
export const schemaExports: string[]

// see https://github.com/bcherny/json-schema-to-typescript/issues/439 if some types are not exported
export type TheseLimitsWereDefinedUsingDefaultValuesOnlyNotSpecificallyDefined = boolean;
export type YYYYMMMonthTheConsumptionCounterBelongsToUsedToResetDefaultsDocsMonthly = string;

export type Limits = {
  type: string;
  id: string;
  name?: string;
  lastUpdate: string;
  defaults?: TheseLimitsWereDefinedUsingDefaultValuesOnlyNotSpecificallyDefined;
  consumptionMonth?: YYYYMMMonthTheConsumptionCounterBelongsToUsedToResetDefaultsDocsMonthly;
  ai_credits?: {
    limit?: number;
    consumption?: number;
  };
}


export declare function validate(data: any): data is Limits
export declare function assertValid(data: any, options?: import('@data-fair/lib-validation').AssertValidOptions): asserts data is Limits
export declare function returnValid(data: any, options?: import('@data-fair/lib-validation').AssertValidOptions): Limits
      