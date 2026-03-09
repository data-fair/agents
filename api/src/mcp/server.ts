import config from '#config'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { searchDatasets, describeDataset, searchData, aggregateData } from '../tools/datasets/index.ts'
import { createPrivateAxios } from '../tools/axios.ts'

const publicAxios = createPrivateAxios(config.privateDataFairUrl)

const server = new McpServer({ name: 'datafair-datasets', version: '1.0.0' })
export default server

function prepareResult<T> (structuredContent: T) {
  return {
    structuredContent,
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
    return prepareResult(await searchDatasets.execute(params, publicAxios))
  }
)

server.registerTool(
  'describe_dataset',
  {
    title: 'Describe Dataset',
    description: describeDataset.description,
    inputSchema: describeDataset.inputSchema,
    outputSchema: describeDataset.outputSchema,
    annotations: {
      readOnlyHint: true
    },
  },
  async (params) => {
    return prepareResult(await describeDataset.execute(params, publicAxios))
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
    return prepareResult(await searchData.execute(params, publicAxios))
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
    return prepareResult(await aggregateData.execute(params, publicAxios))
  }
)
