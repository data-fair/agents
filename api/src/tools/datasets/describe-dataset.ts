import { tool } from 'ai'
import { z } from 'zod'
import { createPrivateAxios } from '../axios.ts'
import type { AxiosInstance } from 'axios'
import debugModule from 'debug'
import type { ToolModule } from '../types.ts'

const debug = debugModule('tools:describe-dataset')

const description = 'Retrieve detailed metadata for a dataset by its ID including column schema, spatial/temporal coverage, and other metadata. Use this to understand dataset structure after finding it with search_datasets and before searching data with search_data.'

const inputSchema = z.object({
  datasetId: z.string().describe('The unique dataset ID obtained from search_datasets or provided by the user')
})

const outputSchema = z.object({
  id: z.string().describe('Unique dataset Id (required for search_data tools)'),
  slug: z.string().optional().describe('Human-readable unique identifier for the dataset, used in URLs'),
  title: z.string().describe('Dataset title'),
  summary: z.string().optional().describe('A brief summary of the dataset content'),
  description: z.string().optional().describe('A markdown description of the dataset content'),
  link: z.string().describe('Link to the dataset page (must be included in responses as citation source)'),
  count: z.number().describe('Total number of data rows in the dataset'),
  keywords: z.array(z.string()).optional().describe('Keywords associated with the dataset'),
  origin: z.string().optional().describe('Source or provider of the dataset'),
  license: z.object({
    href: z.string().describe('URL to the license text'),
    title: z.string().describe('License name/title')
  }).optional().describe('Dataset license information (must be included in responses)'),
  topics: z.array(z.string()).optional().describe('Topics/categories the dataset belongs to'),
  spatial: z.any().optional().describe('Spatial coverage information'),
  temporal: z.any().optional().describe('Temporal coverage information'),
  frequency: z.string().optional().describe('Update frequency of the dataset'),
  schema: z.array(
    z.object({
      key: z.string().describe('Column identifier'),
      type: z.string().describe('Data type of the column'),
      title: z.string().optional().describe('Human-readable column title'),
      description: z.string().optional().describe('Column description'),
      enum: z.array(z.any()).optional().describe('List of all possible values for this column'),
      labels: z.record(z.string()).optional().describe('Object mapping actual data values (keys) to human-readable labels (values). Use keys for filters.'),
      concept: z.string().optional().describe('Semantic concept associated with the column')
    })
  ).describe('Dataset column schema with types and metadata'),
  sampleLines: z.array(z.record(z.any())).describe(
    'Array of 3 sample data rows showing real values from the dataset. Use these examples to understand exact formatting, casing, and typical values for _eq and _search filters.'
  )
})

const execute = async (params: z.infer<typeof inputSchema>, axios: AxiosInstance): Promise<z.infer<typeof outputSchema>> => {
  debug('Executing describe_dataset tool with datasetId:', params.datasetId)

  const fetchedData = (await axios.get(`/datasets/${params.datasetId}`)).data

  const dataset: any = {
    id: fetchedData.id,
    title: fetchedData.title,
    link: fetchedData.page,
    count: fetchedData.count
  }

  if (fetchedData.slug) dataset.slug = fetchedData.slug
  if (fetchedData.summary) dataset.summary = fetchedData.summary
  if (fetchedData.description) dataset.description = fetchedData.description
  if (fetchedData.keywords) dataset.keywords = fetchedData.keywords
  if (fetchedData.origin) dataset.origin = fetchedData.origin
  if (fetchedData.license) dataset.license = fetchedData.license
  if (fetchedData.topics) dataset.topics = fetchedData.topics.map((topic: any) => topic.title)
  if (fetchedData.spatial) dataset.spatial = fetchedData.spatial
  if (fetchedData.temporal) dataset.temporal = fetchedData.temporal
  if (fetchedData.frequency) dataset.frequency = fetchedData.frequency

  if (fetchedData.schema) {
    dataset.schema = fetchedData.schema
      .filter((col: any) => !['_i', '_id', '_rand'].includes(col.key))
      .map((col: any) => {
        const colResult: any = {
          key: col.key,
          type: col.type
        }

        if (col.title) colResult.title = col.title
        if (col.description) colResult.description = col.description
        if (col['x-concept']?.title || col['x-concept']?.id) {
          colResult.concept = col['x-concept']?.title || col['x-concept']?.id
        }
        if (col.enum) colResult.enum = col.enum
        if (col['x-labels']) colResult.labels = col['x-labels']

        return colResult
      })
  }

  const sampleLines = (await axios.get(`/datasets/${params.datasetId}/lines?size=3`)).data.results
  dataset.sampleLines = sampleLines

  return dataset
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
