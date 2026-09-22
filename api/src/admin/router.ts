import { resolve } from 'node:path'
import { readFile } from 'node:fs/promises'
import { Router } from 'express'
import { session } from '@data-fair/lib-express/index.js'
import config from '#config'
import { getSettings } from '../settings/service.ts'
import { resolveRoleModel } from '../models/service.ts'
import { validateGithubSourcePath, buildGithubUrl, truncateGithubBody, githubErrorMessage } from './github-proxy.ts'

const router = Router()
export default router

// All routes in the router are only for the super admins of the service
router.use(async (req, res, next) => {
  await session.reqAdminMode(req)
  next()
})

let info = { version: process.env.NODE_ENV }
if (process.env.NODE_ENV === 'production') {
  info = JSON.parse(await readFile(resolve(import.meta.dirname, '../../../BUILD.json'), 'utf8'))
}
router.get('/info', async (req, res) => {
  const evaluatorAccount = config.evaluatorAccount ?? null
  let evaluatorAvailable = false
  if (evaluatorAccount) {
    const settings = await getSettings(evaluatorAccount)
    // Two independent conditions, both required:
    // - the gateway refuses any account whose assistant role cannot be resolved
    //   ("Agent not configured") regardless of the requested role, so the
    //   assistant must resolve or the chat would 404 on every call;
    // - the evaluator role must resolve to a model actually flagged for the
    //   `evaluator` usage. Resolution alone is not enough: the role's fallback
    //   chain ends on the assistant, so an account with no evaluator-capable
    //   model still resolves *something* here. Advertising that would offer a
    //   promoted-evaluator chat backed by a model nobody picked for the job.
    const resolveEntry = (role: 'assistant' | 'evaluator') => {
      try {
        return resolveRoleModel(settings, role).entry
      } catch { return null }
    }
    evaluatorAvailable = !!resolveEntry('assistant') && !!resolveEntry('evaluator')?.usage.includes('evaluator')
  }
  res.send({ ...info, evaluatorAccount, evaluatorAvailable })
})

// Superadmin-only read-only proxy to the public GitHub REST API, scoped to the
// platform's own repos, so the trace evaluator can read source as ground truth.
router.get('/github', async (req, res, next) => {
  try {
    const path = typeof req.query.path === 'string' ? req.query.path : ''
    const query = typeof req.query.query === 'string' ? req.query.query : undefined
    const raw = req.query.raw === '1' || req.query.raw === 'true'

    const valid = validateGithubSourcePath(path)
    if (!valid.ok) {
      res.status(400).type('text/plain').send(valid.message)
      return
    }

    const headers: Record<string, string> = {
      Accept: raw ? 'application/vnd.github.raw' : 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    }
    if (config.github?.token) headers.Authorization = `Bearer ${config.github.token}`

    const ghRes = await fetch(buildGithubUrl(path, query), { headers })
    const body = await ghRes.text()
    if (!ghRes.ok) {
      res.status(ghRes.status).type('text/plain')
        .send(githubErrorMessage(ghRes.status, ghRes.headers.get('x-ratelimit-remaining'), body))
      return
    }
    const { text, truncated } = truncateGithubBody(body)
    res.type('text/plain').send(text + (truncated ? '\n\n…(response truncated)' : ''))
  } catch (err) {
    next(err)
  }
})
