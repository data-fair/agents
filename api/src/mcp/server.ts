import config from '#config'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import * as searchDatasets from '../tools/datasets/search-datasets.ts'
import * as describeDatasets from '../tools/datasets/describe-dataset.ts'
import * as searchData from '../tools/datasets/search-data.ts'
import * as aggregateData from '../tools/datasets/aggregate-data.ts'
import { createAxios } from '../tools/datasets/axios.ts'

const publicAxios = createAxios(config.privateDataFairUrl)

const server = new McpServer({ name: 'datafair-datasets', version: '1.0.0' })
export default server

function prepareResult<T> (structuredContent: T) {
  return {
    // https://modelcontextprotocol.io/specification/2025-06-18/server/tools#tool-result
    structuredContent,
    // For backwards compatibility, a tool that returns structured content
    // SHOULD also return the serialized JSON in a TextContent block.
    content: [{ type: 'text' as const, text: JSON.stringify(structuredContent) }]
  }
}

server.registerTool(
  'search_datasets',
  {
    title: 'Search Datasets',
    description: searchDatasets.description,
    inputSchema: searchDatasets.inputSchema,
    outputSchema: searchDatasets.outputSchema,
    annotations: {
      readOnlyHint: true
    },
  },
  async (params) => {
    return prepareResult(await searchDatasets.execute!(params, publicAxios))
  }
)

server.registerTool(
  'describe_dataset',
  {
    title: 'Describe Dataset',
    description: describeDatasets.description,
    inputSchema: describeDatasets.inputSchema,
    outputSchema: describeDatasets.outputSchema,
    annotations: {
      readOnlyHint: true
    },
  },
  async (params) => {
    return prepareResult(await describeDatasets.execute!(params, publicAxios))
  }
)

server.registerTool(
  'search_data',
  {
    title: 'Search data from a dataset',
    description: searchData.description,
    inputSchema: searchData.inputSchema,
    outputSchema: searchData.outputSchema,
    annotations: {
      readOnlyHint: true
    },
  },
  async (params) => {
    return prepareResult(await searchData.execute!(params, publicAxios))
  }
)

server.registerTool(
  'aggregate_data',
  {
    title: 'Aggregate data from a dataset',
    description: aggregateData.description,
    inputSchema: aggregateData.inputSchema,
    outputSchema: aggregateData.outputSchema,
    annotations: {
      readOnlyHint: true
    },
  },
  async (params) => {
    return prepareResult(await aggregateData.execute!(params, publicAxios))
  }
)
