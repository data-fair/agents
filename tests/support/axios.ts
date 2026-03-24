import { axiosBuilder } from '@data-fair/lib-node/axios.js'
import { axiosAuth as _axiosAuth } from '@data-fair/lib-node/axios-auth.js'

export const directoryUrl = `http://localhost:${process.env.NGINX_PORT}/simple-directory`
export const baseURL = `http://localhost:${process.env.DEV_API_PORT}`

const axiosOpts = { baseURL }

export const axios = (opts = {}) => axiosBuilder({ ...axiosOpts, ...opts })
export const anonymousAx = axios()

export const axiosAuth = (user: string) => {
  return _axiosAuth({ email: user + '@test.com', password: 'passwd', axiosOpts, directoryUrl })
}

export const defaultQuotas = {
  global: { unlimited: false, dailyTokenLimit: 100000, monthlyTokenLimit: 1000000 },
  admin: { unlimited: true, dailyTokenLimit: 0, monthlyTokenLimit: 0 },
  contrib: { unlimited: false, dailyTokenLimit: 0, monthlyTokenLimit: 0 },
  user: { unlimited: false, dailyTokenLimit: 0, monthlyTokenLimit: 0 },
  external: { unlimited: false, dailyTokenLimit: 0, monthlyTokenLimit: 0 },
  anonymous: { unlimited: false, dailyTokenLimit: 0, monthlyTokenLimit: 0 }
}

export const clean = async () => {
  await anonymousAx.delete(`http://localhost:${process.env.DEV_API_PORT}/api/test-env`)
}
