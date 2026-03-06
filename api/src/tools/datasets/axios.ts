import { axiosBuilder } from '@data-fair/lib-node/axios.js'
import type { AxiosRequestConfig } from 'axios'

export const createAxios = (dataFairUrl: string, cookies?: string) => {
  const headers: Record<string, string> = { 'User-Agent': '@data-fair/agents (Datasets)' }
  if (cookies) headers['Cookie'] = cookies
  const axiosConfig: AxiosRequestConfig = { baseURL: dataFairUrl + '/api/v1', headers }
  return axiosBuilder(axiosConfig)
}
