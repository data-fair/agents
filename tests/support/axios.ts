import { axiosBuilder } from '@data-fair/lib-node/axios.js'
import { axiosAuth as _axiosAuth } from '@data-fair/lib-node/axios-auth.js'

export const directoryUrl = `http://localhost:${process.env.NGINX_PORT}/simple-directory`
export const baseURL = `http://localhost:${process.env.DEV_API_PORT}`

// API tests address the server directly on DEV_API_PORT, so unlike every real client
// (and unlike the e2e tests) nothing sits in front of it to set the x-forwarded-*
// headers. The server needs the client IP for two things and has no fallback for a
// missing header: per-IP anonymous quota tracking, and the hard IP binding that
// simple-directory stamps into sensitive sessions (superadmins get boundIp in their
// token, and a mismatch or missing header rejects the request). So the test client
// stands in for the reverse proxy here.
// 127.0.0.1 is the address simple-directory itself records as boundIp at login: it is
// reached through nginx, which resolves this same loopback client. The two must agree.
// Exported because the gateway specs drive the API through the AI SDK rather than these
// axios instances, and those clients have to set the header for themselves.
export const proxyHeaders = { 'x-forwarded-for': '127.0.0.1' }

const axiosOpts = { baseURL, headers: proxyHeaders }

export const axios = (opts = {}) => axiosBuilder({ ...axiosOpts, ...opts })
export const anonymousAx = axios()

export const getAnonymousActionToken = async (): Promise<string> => {
  const res = await anonymousAx.get(directoryUrl + '/api/auth/anonymous-action')
  return typeof res.data === 'string' ? res.data : String(res.data)
}

export const axiosAuth = (user: string, opts?: { adminMode?: boolean, org?: string }) => {
  return _axiosAuth({ email: user + '@test.com', password: 'passwd', adminMode: opts?.adminMode, org: opts?.org, axiosOpts, directoryUrl })
}

export const superAdmin = axiosAuth('superadmin', { adminMode: true })

export const defaultQuotas = {
  global: { unlimited: false, monthlyLimit: 10 },
  admin: { unlimited: true, monthlyLimit: 0 },
  contrib: { unlimited: false, monthlyLimit: 0 },
  user: { unlimited: false, monthlyLimit: 0 },
  external: { unlimited: false, monthlyLimit: 0 },
  anonymous: { unlimited: false, monthlyLimit: 0 },
  untrusted: { unlimited: false, monthlyLimit: 0 }
}

export const clean = async () => {
  await anonymousAx.delete(`http://localhost:${process.env.DEV_API_PORT}/api/test-env`)
}
