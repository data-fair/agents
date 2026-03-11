import config from '#config'
import { Router } from 'express'
import { generateText, streamText } from 'ai'
import { assertAccountRole, reqSessionAuthenticated } from '@data-fair/lib-express'
import { getRawSettings } from '../settings/service.ts'
import { listAgents, createModel, createDatasetsExplorerTool } from './operations.ts'
import type { Settings } from '#types'
import agentsMongo from '../mongo.ts'
import { createTraceIntegration } from '../telemetry/trace-integration.ts'
import { randomUUID } from 'crypto'

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

  if (!req.body.prompt?.trim()) {
    res.status(400).json({ error: 'Prompt is required' })
    return
  }

  const datasetsExplorerConfig = agentConfig.datasetsExplorer as { model?: { id: string; name: string; provider: { type: string; name: string; id: string } } } | undefined
  const datasetsExplorerTool = createDatasetsExplorerTool(
    config.privateDataFairUrl,
    req.headers.cookie,
    settings.providers,
    datasetsExplorerConfig?.model,
    aiModel
  )

  let result
  try {
    result = await generateText({
      model: aiModel,
      system: agentConfig.prompt,
      prompt: req.body.prompt,
      tools: { datasetsExplorer: datasetsExplorerTool }
    })
  } catch (err: any) {
    if (err?.Symbol === Symbol.for('vercel.ai.error.AI_NoOutputGeneratedError')) {
      console.error('No output generated', { prompt: req.body.prompt })
      res.status(502).json({ error: 'Model failed to generate output' })
      return
    }
    throw err
  }

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

  const enableTrace = req.query.trace === 'true'
  let traceId: string | undefined
  let traceIntegration: ReturnType<typeof createTraceIntegration> | undefined

  if (enableTrace) {
    traceId = randomUUID()
    traceIntegration = createTraceIntegration(owner.id, agentsMongo.traces, traceId)
  }

  const aiModel = createModel(provider, model.id)

  if (!req.body.prompt?.trim()) {
    res.status(400).json({ error: 'Prompt is required' })
    return
  }

  const datasetsExplorerConfigStream = agentConfig.datasetsExplorer as { model?: { id: string; name: string; provider: { type: string; name: string; id: string } } } | undefined
  const datasetsExplorerToolStream = createDatasetsExplorerTool(
    config.privateDataFairUrl,
    req.headers.cookie,
    settings.providers,
    datasetsExplorerConfigStream?.model,
    aiModel,
    traceId,
    owner.id,
    enableTrace ? agentsMongo.traces : undefined
  )

  const result = enableTrace && traceIntegration && traceId
    ? streamText({
      model: aiModel,
      system: agentConfig.prompt,
      prompt: req.body.prompt,
      tools: { datasetsExplorer: datasetsExplorerToolStream },
      experimental_telemetry: {
        isEnabled: true,
        functionId: traceId!,
        metadata: {
          traceId: traceId!,
          userId: owner.id
        },
        integrations: [traceIntegration]
      }
    })
    : streamText({
      model: aiModel,
      system: agentConfig.prompt,
      prompt: req.body.prompt,
      tools: { datasetsExplorer: datasetsExplorerToolStream }
    })

  if (traceId) {
    res.setHeader('X-Trace-ID', traceId)
  }

  res.on('error', (err: any) => {
    if (err?.Symbol === Symbol.for('vercel.ai.error.AI_NoOutputGeneratedError')) {
      console.error('No output generated in stream', { prompt: req.body.prompt, traceId })
      if (!res.headersSent) {
        res.status(502).json({ error: 'Model failed to generate output' })
      }
    }
  })

  result.pipeTextStreamToResponse(res, { headers: { 'Cache-Control': 'no-cache' } })
})
