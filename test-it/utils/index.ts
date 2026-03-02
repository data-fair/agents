import { axiosBuilder } from '@data-fair/lib-node/axios.js'
import { axiosAuth as _axiosAuth } from '@data-fair/lib-node/axios-auth.js'
import mongo from '../../api/src/mongo.ts'

const directoryUrl = `http://localhost:${process.env.NGINX_PORT}/simple-directory`
export const baseURL = `http://localhost:${process.env.DEV_API_PORT}`

const axiosOpts = { baseURL }

export const axios = (opts = {}) => axiosBuilder({ ...axiosOpts, ...opts })

export const axiosAuth = (email: string) => {
  return _axiosAuth({ email, password: 'TestPasswd01', axiosOpts, directoryUrl })
}

export const clean = async () => {
  await mongo.db.collection('settings').deleteMany({})
}

export const startApiServer = async () => {
  const apiServer = await import('../../api/src/server.ts')
  await apiServer.start()
}

export const stopApiServer = async () => {
  const apiServer = await import('../../api/src/server.ts')
  await apiServer.stop()
}
