import { Router } from 'express'
import { generateText, streamText, tool } from 'ai'
import { z } from 'zod'
import { assertAccountRole, reqSessionAuthenticated } from '@data-fair/lib-express'
import { getRawSettings } from '../settings/service.ts'
import { createModel } from '../models/operations.ts'
import agentsMongo from '../mongo.ts'
import { createTraceIntegration } from '../traces/trace-integration.ts'
import { randomUUID } from 'crypto'
import type { Settings } from '#types'

const router = Router()
export default router

const completionTool = tool({
  description: 'Check if the conversation has reached a satisfactory conclusion',
  inputSchema: z.object({
    lastAssistantResponse: z.string(),
    conversationGoal: z.string()
  }),
  outputSchema: z.object({
    done: z.boolean(),
    reason: z.string()
  }),
  execute: async ({ lastAssistantResponse, conversationGoal }) => {
    return { done: false, reason: 'continue' }
  }
})

interface EvaluationTask {
  initialPrompt: string
  idealResult: string
  userDescription?: string
  maxTurns?: number
}

interface EvaluationResult {
  taskIndex: number
  initialPrompt: string
  conversation: Array<{ role: 'user' | 'assistant'; content: string }>
  traceIds: string[]
  finalResponse: string
  rankings: {
    quality: number
    efficiency: number
  }
  summary: string
  suggestions?: string[]
}

async function getEvaluatorModel (settings: Settings) {
  const modelConfig = settings.evaluatorModel || settings.chatModel
  if (!modelConfig) throw new Error('No model configured')

  const provider = settings.providers.find(p => p.id === modelConfig.provider.id)
  if (!provider) throw new Error('Provider not found')
  if (!provider.enabled) throw new Error('Provider is disabled')

  return createModel(provider, modelConfig.id)
}

async function getAssistantModel (settings: Settings) {
  const modelConfig = settings.chatModel
  if (!modelConfig) throw new Error('Chat model not configured')

  const provider = settings.providers.find(p => p.id === modelConfig.provider.id)
  if (!provider) throw new Error('Provider not found')
  if (!provider.enabled) throw new Error('Provider is disabled')

  return createModel(provider, modelConfig.id)
}

router.post('/run', async (req, res, next) => {
  try {
    const session = reqSessionAuthenticated(req)
    const owner = session.account
    assertAccountRole(session, owner, 'admin')

    const { tasks, traceId: existingTraceId, idealResult } = req.body

    const settings = await getRawSettings(owner) as Settings | null
    if (!settings) {
      res.status(400).json({ error: 'Settings not found' })
      return
    }

    if (existingTraceId && idealResult) {
      const result = await evaluateExistingTrace(existingTraceId, idealResult, settings, owner.id)
      res.json(result)
      return
    }

    if (!tasks || !Array.isArray(tasks)) {
      res.status(400).json({ error: 'Tasks array required' })
      return
    }

    const results: EvaluationResult[] = []
    let totalQuality = 0
    let totalEfficiency = 0

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i]
      const maxTurns = Math.min(task.maxTurns || 5, 10)
      const result = await runEvaluationTask(task, maxTurns, settings, owner.id)
      results.push(result)
      totalQuality += result.rankings.quality
      totalEfficiency += result.rankings.efficiency
    }

    res.json({
      results,
      overallQuality: Math.round(totalQuality / results.length),
      overallEfficiency: Math.round(totalEfficiency / results.length)
    })
  } catch (err) {
    next(err)
  }
})

async function runEvaluationTask (
  task: EvaluationTask,
  maxTurns: number,
  settings: Settings,
  userId: string
): Promise<EvaluationResult> {
  const evaluatorModel = await getEvaluatorModel(settings)
  const assistantModel = await getAssistantModel(settings)

  const conversation: Array<{ role: 'user' | 'assistant'; content: string }> = []
  const traceId = randomUUID()
  const traceIntegration = createTraceIntegration(userId, agentsMongo.traces, traceId)

  let currentPrompt = task.initialPrompt

  if (!currentPrompt?.trim()) {
    throw new Error('Task initialPrompt is required')
  }

  for (let turn = 0; turn < maxTurns; turn++) {
    conversation.push({ role: 'user', content: currentPrompt })

    let fullResponse = ''
    try {
      const streamResult = await streamText({
        model: assistantModel,
        prompt: currentPrompt,
        experimental_telemetry: {
          isEnabled: true,
          functionId: traceId,
          metadata: { traceId, userId, turn: turn.toString() },
          integrations: [traceIntegration]
        }
      })

      for await (const chunk of streamResult.textStream) {
        fullResponse += chunk
      }
    } catch (err: any) {
      if (err?.Symbol === Symbol.for('vercel.ai.error.AI_NoOutputGeneratedError')) {
        console.error(`No output generated at turn ${turn}`, { traceId, prompt: currentPrompt })
        return {
          taskIndex: 0,
          initialPrompt: task.initialPrompt,
          conversation,
          traceIds: [traceId],
          finalResponse: fullResponse || 'Error: No output generated',
          rankings: { quality: 0, efficiency: 0 },
          summary: `Failed to generate output after ${turn + 1} turn(s)`,
          suggestions: ['Check model configuration and API keys']
        }
      }
      throw err
    }

    conversation.push({ role: 'assistant', content: fullResponse })

    const completionCheck = await generateText({
      model: evaluatorModel,
      system: `You are evaluating whether a conversation has reached a satisfactory conclusion.
Conversation goal: ${task.idealResult}
Use the completion tool to indicate if the assistant has done its best or if the conversation should continue.`,
      prompt: `Last assistant response: ${fullResponse}`,
      tools: { checkCompletion: completionTool }
    })

    const toolResultData = completionCheck.toolResults[0] as any
    const toolResult = toolResultData?.result as { done: boolean; reason: string } | undefined
    if (toolResult?.done) {
      break
    }

    if (turn < maxTurns - 1) {
      const userSimResponse = await generateText({
        model: evaluatorModel,
        system: task.userDescription || 'You are a user interacting with an assistant. Continue the conversation naturally.',
        messages: conversation.map(m => ({ role: m.role, content: m.content }))
      })
      currentPrompt = userSimResponse.text
    }
  }

  const finalResponse = conversation.filter(m => m.role === 'assistant').pop()?.content || ''

  const qualityCheck = await generateText({
    model: evaluatorModel,
    system: 'You are evaluating the quality of an AI response. Rate it from 0-100 based on how well it matches the ideal result.',
    prompt: `Ideal result: ${task.idealResult}\n\nActual response: ${finalResponse}\n\nProvide a quality score (0-100) and a brief explanation.`
  })

  const qualityMatch = qualityCheck.text.match(/(\d+)/)
  const quality = qualityMatch ? parseInt(qualityMatch[1]) : 50

  const traceEvents = await agentsMongo.traces
    .find({ traceId, userId })
    .sort({ timestamp: 1 })
    .toArray()

  const efficiencyAnalysis = await generateText({
    model: evaluatorModel,
    system: 'You are analyzing the efficiency of an AI conversation trace. Rate efficiency 0-100 and provide suggestions.',
    prompt: `Conversation trace: ${JSON.stringify(traceEvents)}\n\nAnalyze the trace and provide:\n1. Efficiency score (0-100)\n2. Summary of the conversation\n3. Suggestions for improvement (if any)`
  })

  const efficiencyMatch = efficiencyAnalysis.text.match(/(\d+)/)
  const efficiency = efficiencyMatch ? parseInt(efficiencyMatch[1]) : 70

  return {
    taskIndex: 0,
    initialPrompt: task.initialPrompt,
    conversation,
    traceIds: [traceId],
    finalResponse,
    rankings: { quality, efficiency },
    summary: efficiencyAnalysis.text,
    suggestions: []
  }
}

async function evaluateExistingTrace (
  traceId: string,
  idealResult: string,
  settings: Settings,
  userId: string
) {
  const evaluatorModel = await getEvaluatorModel(settings)

  const traceEvents = await agentsMongo.traces
    .find({ traceId, userId })
    .sort({ timestamp: 1 })
    .toArray()

  const analysis = await generateText({
    model: evaluatorModel,
    system: 'You are evaluating an existing conversation trace. Provide quality and efficiency scores with a summary.',
    prompt: `Trace events: ${JSON.stringify(traceEvents)}\n\nIdeal result: ${idealResult}\n\nAnalyze and provide quality (0-100), efficiency (0-100), summary, and suggestions.`
  })

  const qualityMatch = analysis.text.match(/quality[:\s]*(\d+)/i)
  const efficiencyMatch = analysis.text.match(/efficiency[:\s]*(\d+)/i)

  return {
    results: [{
      taskIndex: 0,
      initialPrompt: '',
      conversation: [],
      traceIds: [traceId],
      finalResponse: '',
      rankings: {
        quality: qualityMatch ? parseInt(qualityMatch[1]) : 50,
        efficiency: efficiencyMatch ? parseInt(efficiencyMatch[1]) : 70
      },
      summary: analysis.text,
      suggestions: []
    }],
    overallQuality: qualityMatch ? parseInt(qualityMatch[1]) : 50,
    overallEfficiency: efficiencyMatch ? parseInt(efficiencyMatch[1]) : 70
  }
}

router.get('/traces/:traceId', async (req, res, next) => {
  try {
    const session = reqSessionAuthenticated(req)
    const owner = session.account
    assertAccountRole(session, owner, 'admin')

    const { traceId } = req.params

    const events = await agentsMongo.traces
      .find({ traceId, userId: owner.id })
      .sort({ timestamp: 1 })
      .toArray()

    res.json({ results: events, count: events.length })
  } catch (err) {
    next(err)
  }
})
