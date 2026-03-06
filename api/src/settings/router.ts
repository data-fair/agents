import { Router } from 'express'
import { reqSessionAuthenticated } from '@data-fair/lib-express'
import * as putReqBody from '#doc/settings/put-req/index.ts'
import { getSettingsByOwner, putSettings } from './service.ts'

const router = Router()
export default router

router.get('/:type/:id', async (req, res, next) => {
  const session = reqSessionAuthenticated(req)
  const { type, id } = req.params

  const settings = await getSettingsByOwner(session, type, id)

  if (!settings) {
    res.json({ owner: { type, id }, globalPrompt: '', providers: [] })
    return
  }

  res.json(settings)
})

router.put('/:type/:id', async (req, res, next) => {
  const session = reqSessionAuthenticated(req)
  const { type, id } = req.params
  const body = putReqBody.returnValid(req.body, { name: 'body' })

  const settings = await putSettings(session, type, id, body)
  res.json(settings)
})
