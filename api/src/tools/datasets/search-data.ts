import { tool } from 'ai'
import { z } from 'zod'
import { createPrivateAxios } from '../axios.ts'
import type { AxiosInstance } from 'axios'
import { filtersSchema } from './utils.ts'
import debugModule from 'debug'
import type { ToolModule } from '../types.ts'

const debug = debugModule('tools:search-data')

const description = 'Search for data rows in a specific dataset using either :\n- Full-text search across all columns (query) for quick, broad matches\n- Precise filtering (filters) to apply exact conditions, comparisons, or column-specific searches.\nUse filters whenever your question involves multiple criteria or numerical/date ranges, as they yield more relevant and targeted results. The query parameter is better suited for simple, one-keyword searches across the entire dataset. Returns matching rows with relevance scores and some metadata. Always include the filtered view link, the dataset link and the license information when presenting results to users. Use describe_dataset first to understand the data structure.'

const inputSchema = z.object({
  datasetId: z.string().describe('The unique dataset ID obtained from search_datasets or provided by the user'),
  query: z.string().optional().describe('French keywords for full-text search across all dataset columns (simple keywords, not sentences). Do not use with filters parameter. Examples: "Jean Dupont", "Paris", "2025"'),
  filters: filtersSchema,
  select: z.string().optional().describe('Optional comma-separated list of column keys to include in the results. Useful when the dataset has many columns to reduce output size. If not provided, all columns are returned. Use column keys from describe_dataset. Format: column1,column2,column3 (No spaces after commas). Example: "nom,age,ville"')
})

const outputSchema = z.object({
  datasetId: z.string().describe('The dataset ID that was searched'),
  count: z.number().describe('Number of data rows matching the search criteria and filters'),
  lines: z.array(
    z.record(z.any()).describe('Data row object containing column keys as object keys with their values, plus _score field indicating search relevance (higher score = more relevant)')
  ).describe('An array of the top 10 data rows matching the search criteria.')
})

const execute = async (params: z.infer<typeof inputSchema>, axios: AxiosInstance): Promise<z.infer<typeof outputSchema>> => {
  debug('Executing search_data tool with dataset:', params.datasetId, 'query:', params.query, 'select:', params.select, 'filters:', params.filters)

  const fetchParams: Record<string, any> = { size: '10' }
  if (params.query) {
    fetchParams.q = params.query
    fetchParams.q_mode = 'complete'
  }
  if (params.filters) {
    for (const [key, value] of Object.entries(params.filters)) {
      fetchParams[key] = String(value)
    }
  }
  if (params.select) fetchParams.select = params.select

  const response = (await axios.get(`/datasets/${params.datasetId}/lines`, { params: fetchParams })).data

  return {
    datasetId: params.datasetId,
    count: response.total,
    lines: response.results
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
