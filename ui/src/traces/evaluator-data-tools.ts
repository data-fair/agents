import { tool, jsonSchema } from 'ai'
import type { Tool } from 'ai'
import { ofetch } from 'ofetch'
import * as listDatasets from '@data-fair/agent-tools-data-fair/list-datasets'
import * as describeDataset from '@data-fair/agent-tools-data-fair/describe-dataset'
import * as getDatasetSchema from '@data-fair/agent-tools-data-fair/get-dataset-schema'
import * as searchData from '@data-fair/agent-tools-data-fair/search-data'
import * as aggregateData from '@data-fair/agent-tools-data-fair/aggregate-data'
import * as calculateMetric from '@data-fair/agent-tools-data-fair/calculate-metric'
import * as getFieldValues from '@data-fair/agent-tools-data-fair/get-field-values'

export interface EvaluatorDataToolsOpts {
  accountType: string
  accountId: string
  department?: string
  dataFairApiPath: string
  // injectable for tests; defaults to a same-origin, credentialed ofetch instance
  apiFetch?: (path: string, opts?: { query?: Record<string, string> }) => Promise<any>
}

const UNAVAILABLE = 'Data exploration is unavailable here (the data-fair API could not be reached). This evaluator may be running outside a data-fair deployment, or a superadmin may need to enable admin mode to access this account.'

export function buildEvaluatorDataTools (opts: EvaluatorDataToolsOpts): Record<string, Tool> {
  const apiFetch = opts.apiFetch ?? ofetch.create({ baseURL: opts.dataFairApiPath, credentials: 'include' })
  const ownerFilter = opts.department
    ? `${opts.accountType}:${opts.accountId}:${opts.department}`
    : `${opts.accountType}:${opts.accountId}`

  // Wrap an execute so any fetch failure degrades to a clear message instead of throwing.
  const safe = <A>(fn: (args: A) => Promise<string>) => async (args: A): Promise<string> => {
    try {
      return await fn(args)
    } catch (err: any) {
      const status = err?.response?.status ?? err?.status
      return status ? `${UNAVAILABLE} (HTTP ${status})` : UNAVAILABLE
    }
  }

  return {
    list_datasets: tool({
      description: listDatasets.schema.description,
      inputSchema: jsonSchema(listDatasets.schema.inputSchema as any),
      execute: safe(async (params: listDatasets.Params) => {
        const { path, query } = listDatasets.buildQuery(params)
        query.owner = ownerFilter
        const data = await apiFetch(path, { query })
        const page = Math.max(params.page || 1, 1)
        const size = Math.min(Math.max(params.size || 10, 1), 50)
        return listDatasets.formatResult(data, page, size).text
      })
    }),

    describe_dataset: tool({
      description: describeDataset.schema.description,
      inputSchema: jsonSchema(describeDataset.schema.inputSchema as any),
      execute: safe(async (params: { datasetId: string }) => {
        const dataset = await apiFetch(`datasets/${encodeURIComponent(params.datasetId)}`)
        return describeDataset.formatResult(dataset, { includeOwner: true }).text
      })
    }),

    get_dataset_schema: tool({
      description: getDatasetSchema.schema.description,
      inputSchema: jsonSchema(getDatasetSchema.schema.inputSchema as any),
      execute: safe(async (params: getDatasetSchema.Params) => {
        const { schemaReq, samplesReq } = getDatasetSchema.buildQuery(params)
        const [dataset, linesData] = await Promise.all([
          apiFetch(schemaReq.path, { query: schemaReq.query }),
          apiFetch(samplesReq.path, { query: samplesReq.query })
        ])
        return getDatasetSchema.formatResult(dataset, linesData)
      })
    }),

    search_data: tool({
      description: searchData.schema.description,
      inputSchema: jsonSchema(searchData.schema.inputSchema as any),
      // `next` is in the tool's inputSchema (pagination URL) but absent from the
      // package's Params type, so widen it here.
      execute: safe(async (params: searchData.Params & { next?: string }) => {
        let data: any
        if (params.next) {
          data = await apiFetch(params.next)
        } else {
          const { path, query } = searchData.buildQuery(params)
          data = await apiFetch(path, { query })
        }
        return searchData.formatResult(data, params).text
      })
    }),

    aggregate_data: tool({
      description: aggregateData.schema.description,
      inputSchema: jsonSchema(aggregateData.schema.inputSchema as any),
      execute: safe(async (params: aggregateData.Params) => {
        const { path, query } = aggregateData.buildQuery(params)
        const data = await apiFetch(path, { query })
        return aggregateData.formatResult(data, params).text
      })
    }),

    calculate_metric: tool({
      description: calculateMetric.schema.description,
      inputSchema: jsonSchema(calculateMetric.schema.inputSchema as any),
      execute: safe(async (params: calculateMetric.Params) => {
        const { path, query } = calculateMetric.buildQuery(params)
        const data = await apiFetch(path, { query })
        return calculateMetric.formatResult(data, params).text
      })
    }),

    get_field_values: tool({
      description: getFieldValues.schema.description,
      inputSchema: jsonSchema(getFieldValues.schema.inputSchema as any),
      execute: safe(async (params: getFieldValues.Params) => {
        const { path, query } = getFieldValues.buildQuery(params)
        const values = await apiFetch(path, { query })
        return getFieldValues.formatResult(values, params).text
      })
    }),

    get_dataset_metadata_raw: tool({
      description: 'Returns the complete raw metadata JSON for a dataset (full schema with every field attribute, extensions, capabilities, license, topics, etc.). Use it to assess metadata quality (missing titles/descriptions/concepts/labels) and to check whether the assistant\'s own tools (describe_dataset / get_dataset_schema) omitted relevant information. Takes the dataset id from list_datasets.',
      inputSchema: jsonSchema({
        type: 'object',
        properties: {
          datasetId: { type: 'string', description: 'The exact dataset ID from list_datasets results.' }
        },
        required: ['datasetId']
      }),
      execute: safe(async (params: { datasetId: string }) => {
        const dataset = await apiFetch(`datasets/${encodeURIComponent(params.datasetId)}`)
        return JSON.stringify(dataset, null, 2)
      })
    })
  }
}
