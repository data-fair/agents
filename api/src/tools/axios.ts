import { axiosBuilder } from '@data-fair/lib-node/axios.js'
import type { AxiosRequestConfig } from 'axios'

export const createPrivateAxios = (privateUrl: string, cookies?: string) => {
  const headers: Record<string, string> = { 'User-Agent': '@data-fair/agents (Datasets)' }
  if (cookies) headers['Cookie'] = cookies
  const axiosConfig: AxiosRequestConfig = { baseURL: privateUrl + '/api/v1', headers }
  return axiosBuilder(axiosConfig)
}
