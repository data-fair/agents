import { tool } from 'ai'
import { z } from 'zod'
import { createPrivateAxios } from '../axios.ts'
import type { AxiosInstance } from 'axios'
import { filtersSchema } from './utils.ts'
import debugModule from 'debug'
import type { ToolModule } from '../types.ts'

const debug = debugModule('tools:aggregate-data')

const description = 'Perform aggregations on dataset columns, such as counting unique values, summing numeric columns, or calculating averages. Use this after describe_dataset to understand the dataset structure and available column keys. Example: {"datasetId": "123", "aggregationColumns": ["code_sexe", "region"], "aggregation": {"column": "age", "metric": "avg"}} this will return the average age grouped by code_sexe and region. Aggregation is limited to a maximum of 3 columns.'

const inputSchema = z.object({
  datasetId: z.string().describe('The unique dataset ID obtained from search_datasets tool'),
  aggregationColumns: z.array(z.string())
    .min(1, 'You must specify at least one column to aggregate')
    .max(3, 'You can aggregate by at most 3 columns')
    .describe('List of column keys to aggregate (use keys from describe_dataset, min 1 column, max 3 columns)'),
  aggregation: z.object({
    column: z.string().describe('The column key to aggregate (use keys from describe_dataset)'),
    metric: z.enum(['sum', 'avg', 'min', 'max', 'count']).describe('Aggregation metric to perform on the column. Available operations are: sum, avg, min, max, count.')
  })
    .optional()
    .describe('The aggregation specification to perform on the specified column. Use keys from describe_dataset. If not provided, defaults to counting unique values in the aggregation column.'),
  filters: filtersSchema
})

const AggregationResult: z.ZodType<any> = z.object({
  total: z.number().describe('Total number of rows aggregated for this column'),
  totalAggregated: z.number().optional().describe('Total number of different values aggregated for this column'),
  nonRepresented: z.number().optional().describe('The number of non-represented rows for this column'),
  columnValue: z.union([z.string(), z.number()]).describe('The value of the aggregated column (string or number)'),
  metricValue: z.number().nullable().optional().describe('The value of the aggregation metric (e.g., sum, avg) on the selected column'),
  aggregations: z.lazy(() => z.array(AggregationResult)).optional().describe('Nested aggregation results when multiple columns are specified (max 3 levels deep)')
})

const outputSchema = z.object({
  total: z.number().describe('The total number of rows in the dataset'),
  totalAggregated: z.number().describe('The total number of different values aggregated across all specified columns'),
  nonRepresented: z.number().describe('The number of non-represented rows in the dataset, 0 if totalAggregated is less than 20, otherwise the number of non-represented rows'),
  datasetId: z.string().describe('The dataset ID that was aggregated'),
  aggregations: z.array(AggregationResult).describe('Array of aggregation results for each specified column (limited to 20 rows)')
})

const execute = async (params: z.infer<typeof inputSchema>, axios: AxiosInstance): Promise<z.infer<typeof outputSchema>> => {
  debug('Executing aggregate_data tool with dataset:', params.datasetId, 'columns:', params.aggregationColumns, 'aggregation:', JSON.stringify(params.aggregation))

  if (params.aggregationColumns.length > 3) {
    throw new Error('You can aggregate by at most 3 columns')
  }

  const aggsParams: Record<string, string> = { field: params.aggregationColumns.slice(0, 3).join(';') }

  if (params.aggregation && params.aggregation.metric !== 'count') {
    aggsParams.metric = params.aggregation.metric
    aggsParams.metric_field = params.aggregation.column
  }

  if (params.filters) {
    for (const [key, value] of Object.entries(params.filters)) {
      aggsParams[key] = value
    }
  }

  const response = (await axios.get(`/data-fair/api/v1/datasets/${params.datasetId}/values_agg`, { params: aggsParams }
  )).data

  const mapAggregation = (agg: any): any => ({
    total: agg.total,
    totalAggregated: agg.total_values,
    nonRepresented: agg.total_other,
    columnValue: agg.value,
    metricValue: agg.metric,
    ...(agg.aggs && agg.aggs.length > 0 && {
      aggregations: agg.aggs.map(mapAggregation)
    })
  })

  return {
    total: response.total,
    totalAggregated: response.total_values,
    nonRepresented: response.total_other,
    datasetId: params.datasetId,
    aggregations: response.aggs.map(mapAggregation)
  }
}

const createTool = (dataFairUrl: string, cookies?: string) => {
  const axios = createPrivateAxios(dataFairUrl, cookies)
  return tool({
    description,
    inputSchema,
    outputSchema,
    strict: true,
    execute: async (params) => execute(params, axios)
  })
}

const toolModule: ToolModule = {
  description,
  inputSchema,
  outputSchema,
  execute,
  createTool
}

export default toolModule
