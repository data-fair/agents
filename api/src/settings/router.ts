import { Router } from 'express'
import { reqSessionAuthenticated } from '@data-fair/lib-express'
import * as postReqBody from '#doc/settings/post-req/index.ts'
import * as putReqBody from '#doc/settings/put-req/index.ts'
import { getSettingsByOwner, createSettings, putSettings } from './service.ts'

const router = Router()
export default router

router.get('/:type/:id', async (req, res, next) => {
  const session = reqSessionAuthenticated(req)
  const { type, id } = req.params

  const settings = await getSettingsByOwner(session, type, id)

  if (!settings) {
    res.status(404).json({ message: 'settings not found' })
    return
  }

  res.json(settings)
})

router.post('/:type/:id', async (req, res, next) => {
  const session = reqSessionAuthenticated(req)
  const { type, id } = req.params
  const { body } = postReqBody.returnValid(req.body, { name: 'body' })

  body.owner = { type: type as 'user' | 'organization', id, name: body.owner?.name }

  const settings = await createSettings(session, body)
  res.status(201).json(settings)
})

router.put('/:type/:id', async (req, res, next) => {
  const session = reqSessionAuthenticated(req)
  const { type, id } = req.params
  const { body } = putReqBody.returnValid(req.body, { name: 'body' })

  const settings = await putSettings(session, type, id, body)
  res.json(settings)
})
