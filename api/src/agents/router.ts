import config from '#config'
import { Router } from 'express'
import { generateText, streamText } from 'ai'
import { assertAccountRole, reqSessionAuthenticated } from '@data-fair/lib-express'
import { getRawSettings } from '../settings/service.ts'
import { listAgents, createModel, getTools } from './operations.ts'
import type { Settings } from '#types'

const router = Router()
export default router

router.get('/', async (req, res, next) => {
  const agents = listAgents()
  res.json({ results: agents, count: agents.length })
})

router.post('/:id/generate-text', async (req, res, next) => {
  const session = reqSessionAuthenticated(req)
  const owner = session.account
  assertAccountRole(session, owner, 'admin')

  const agentId = req.params.id

  if (agentId !== 'back-office-assistant') {
    res.status(404).json({ error: 'Agent not found' })
    return
  }

  const settings = await getRawSettings(owner) as Settings | null

  if (!settings || !settings.agents?.backOfficeAssistant) {
    res.status(400).json({ error: 'Agent not configured' })
    return
  }

  const agentConfig = settings.agents.backOfficeAssistant
  const model = agentConfig.model

  const provider = settings.providers.find(p => p.id === model.provider.id)

  if (!provider) {
    res.status(400).json({ error: 'Provider not found' })
    return
  }

  if (!provider.enabled) {
    res.status(400).json({ error: 'Provider is disabled' })
    return
  }

  const aiModel = createModel(provider, model.id)
  const tools = getTools(config.privateDataFairUrl, req.headers.cookie)

  const result = await generateText({
    model: aiModel,
    system: agentConfig.prompt,
    prompt: req.body.prompt,
    tools
  })

  res.json({
    text: result.text,
    toolCalls: result.toolCalls,
    finishReason: result.finishReason
  })
})

router.post('/:id/stream-text', async (req, res, next) => {
  const session = reqSessionAuthenticated(req)
  const owner = session.account
  assertAccountRole(session, owner, 'admin')

  const agentId = req.params.id

  if (agentId !== 'back-office-assistant') {
    res.status(404).json({ error: 'Agent not found' })
    return
  }

  const settings = await getRawSettings(owner) as Settings | null

  if (!settings || !settings.agents?.backOfficeAssistant) {
    res.status(400).json({ error: 'Agent not configured' })
    return
  }

  const agentConfig = settings.agents.backOfficeAssistant
  const model = agentConfig.model

  const provider = settings.providers.find(p => p.id === model.provider.id)

  if (!provider) {
    res.status(400).json({ error: 'Provider not found' })
    return
  }

  if (!provider.enabled) {
    res.status(400).json({ error: 'Provider is disabled' })
    return
  }

  const aiModel = createModel(provider, model.id)
  const tools = getTools(config.privateDataFairUrl, req.headers.cookie)

  const result = streamText({
    model: aiModel,
    system: agentConfig.prompt,
    prompt: req.body.prompt,
    tools
  })

  result.pipeTextStreamToResponse(res, { headers: { 'Cache-Control': 'no-cache' } })
})
