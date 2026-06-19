import { resolve } from 'node:path'
import { readFile } from 'node:fs/promises'
import { Router } from 'express'
import { session } from '@data-fair/lib-express/index.js'
import config from '#config'
import { getRawSettings } from '../settings/service.ts'

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
    const settings = await getRawSettings(evaluatorAccount)
    // The gateway refuses any account without an assistant model ("Agent not
    // configured"), regardless of the requested role — so the promoted evaluator
    // is only usable when the source account has BOTH an assistant and an
    // evaluator model. Advertising availability on evaluator alone would enable
    // a chat whose every call 404s.
    evaluatorAvailable = !!settings?.models?.assistant?.model && !!settings?.models?.evaluator?.model
  }
  res.send({ ...info, evaluatorAccount, evaluatorAvailable })
})
