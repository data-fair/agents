import { axiosBuilder } from '@data-fair/lib-node/axios.js'

export const baseURL = `http://localhost:${process.env.DEV_API_PORT}`

const axiosOpts = { baseURL }

export const axios = (opts = {}) => axiosBuilder({ ...axiosOpts, ...opts })

export const clean = async () => {
  // TODO: add collections as they are created
}

export const startApiServer = async () => {
  const apiServer = await import('../../api/src/server.ts')
  await apiServer.start()
}

export const stopApiServer = async () => {
  const apiServer = await import('../../api/src/server.ts')
  await apiServer.stop()
}
