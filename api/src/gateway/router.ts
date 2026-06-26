import { Router } from 'express'
import { generateText, streamText, type LanguageModelUsage } from 'ai'
import { type AccountKeys, reqSession, isAuthenticated } from '@data-fair/lib-express'
import { getRawSettings, defaultQuotas } from '../settings/service.ts'
import { getModelConfig, resolveModelForRole, streamedToolCallsBroken } from '../models/operations.ts'
import { recordUsage } from '../usage/service.ts'
import { computeCost } from '../usage/operations.ts'
import { resolveUsageIdentity, enforceQuotas } from '../usage/enforce.ts'
import { convertOpenAITools, convertOpenAIMessages, convertToolChoice, mapFinishReason } from './operations.ts'
import type { OpenAIMessage, OpenAIToolDefinition, OpenAIToolChoice, FinishReason } from './operations.ts'
import { recordTraceRequest } from '../traces/service.ts'
import { parseFlagsCookie } from '../traces/operations.ts'
import { createCapturingFetch, type UpstreamCaptureSink } from '../models/capturing-fetch.ts'
import { extractLastUserMessage, buildModerationContext, moderationApplies } from '../moderation/operations.ts'
import { startModeration, isStrikeCooldownActive, recordStrikeRefusal, type ModerationRun } from '../moderation/service.ts'
import crypto from 'node:crypto'
import createDebug from 'debug'

// Build an OpenAI-compatible usage object, surfacing cache token details when the
// provider reports them (Anthropic cache read/write, OpenAI cached_tokens, etc.).
// The AI SDK normalizes these into usage.inputTokenDetails regardless of provider,
// so the gateway can forward them uniformly for the debug trace.
function buildUsage (usage: LanguageModelUsage | undefined) {
  if (!usage) return undefined
  const promptTokens = usage.inputTokens ?? 0
  const completionTokens = usage.outputTokens ?? 0
  const cacheRead = usage.inputTokenDetails?.cacheReadTokens
  const cacheWrite = usage.inputTokenDetails?.cacheWriteTokens
  const result: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
    prompt_tokens_details?: { cached_tokens: number, cache_creation_tokens: number }
  } = {
    prompt_tokens: promptTokens,
    completion_tokens: completionTokens,
    total_tokens: promptTokens + completionTokens
  }
  if (cacheRead != null || cacheWrite != null) {
    result.prompt_tokens_details = { cached_tokens: cacheRead ?? 0, cache_creation_tokens: cacheWrite ?? 0 }
  }
  return result
}

const router = Router()
export default router

const MODEL_IDS = ['assistant', 'evaluator', 'summarizer', 'tools'] as const
type ModelId = typeof MODEL_IDS[number]

function isValidModelId (id: string): id is ModelId {
  return MODEL_IDS.includes(id as ModelId)
}

// OpenAI-compatible chat completions endpoint
router.post('/:type/:id/v1/chat/completions', async (req, res, next) => {
  try {
    const sessionState = reqSession(req)
    const authenticated = isAuthenticated(sessionState)
    const owner = req.params as unknown as AccountKeys

    const {
      model: modelId,
      messages,
      stream,
      temperature,
      max_tokens: maxTokens,
      top_p: topP,
      stop,
      tools: openaiTools,
      tool_choice: toolChoice
    } = req.body as {
      model: string
      messages: OpenAIMessage[]
      stream?: boolean
      temperature?: number
      max_tokens?: number
      top_p?: number
      stop?: string[]
      tools?: OpenAIToolDefinition[]
      tool_choice?: OpenAIToolChoice
    }

    if (!modelId || !isValidModelId(modelId)) {
      res.status(400).json({
        error: { message: `Invalid model. Must be one of: ${MODEL_IDS.join(', ')}`, type: 'invalid_request_error' }
      })
      return
    }

    const settings = await getRawSettings(owner)
    if (!settings?.models?.assistant?.model) {
      res.status(404).json({
        error: { message: 'Agent not configured', type: 'invalid_request_error' }
      })
      return
    }

    const quotas = settings.quotas ?? defaultQuotas

    const identity = await resolveUsageIdentity(req, owner, quotas, sessionState, authenticated)
    const { usageUserId, usageUserName, poolId } = identity

    const completionId = `chatcmpl-${crypto.randomUUID()}`
    const created = Math.floor(Date.now() / 1000)

    // Refuse outright (no LLM calls, no quota) while a strike cooldown is active.
    const respondBlocked = () => {
      if (stream) {
        res.setHeader('Content-Type', 'text/event-stream')
        res.setHeader('Cache-Control', 'no-cache')
        res.setHeader('Connection', 'keep-alive')
        res.setHeader('X-Accel-Buffering', 'no')
        res.write(`data: ${JSON.stringify({
          id: completionId,
          object: 'chat.completion.chunk',
          created,
          model: modelId,
          choices: [{ index: 0, delta: { role: 'assistant', content: '' }, finish_reason: null }]
        })}\n\n`)
        res.write(`data: ${JSON.stringify({
          id: completionId,
          object: 'chat.completion.chunk',
          created,
          model: modelId,
          choices: [{ index: 0, delta: {}, finish_reason: 'content_filter' }]
        })}\n\n`)
        res.write('data: [DONE]\n\n')
        res.end()
      } else {
        res.json({
          id: completionId,
          object: 'chat.completion',
          created,
          model: modelId,
          choices: [{ index: 0, message: { role: 'assistant', content: null }, finish_reason: 'content_filter' }]
        })
      }
    }

    // Strikes & the cooldown are an anti-abuse measure for untrusted callers
    // only. Moderated trusted members get individual messages blocked by the
    // gate below, but are never locked out.
    if (identity.isUntrusted && identity.usageUserId && await isStrikeCooldownActive(owner, identity.usageUserId)) {
      recordStrikeRefusal(owner, identity, modelId)
      respondBlocked()
      return
    }

    const quotaCheck = await enforceQuotas(owner, quotas, identity)
    if (quotaCheck) {
      res.status(429).json({
        error: {
          message: quotaCheck.reason,
          type: 'rate_limit_error',
          scope: quotaCheck.scope,
          usage: quotaCheck.usage,
          limit: quotaCheck.limit,
          resets_at: quotaCheck.resetsAt
        }
      })
      return
    }

    // Gateway-side input moderation: applies to the configured user categories
    // when the org enabled it, racing the model call.
    let moderation: ModerationRun | null = null
    if (moderationApplies(settings, identity.role)) {
      // Moderate the FULL last user message, including any <hidden-context> block.
      // Direct API callers control the raw body, so stripping the wrapper here
      // would let an untrusted caller smuggle a payload past the gate by forging
      // the sentinels while the model still receives it.
      const lastUserMessage = extractLastUserMessage(messages)
      if (lastUserMessage) {
        // Recent turns give the classifier enough context to read short follow-ups;
        // they are reference-only and never the judged unit (see operations.ts).
        const context = buildModerationContext(messages)
        moderation = startModeration({ settings, owner, identity, message: lastUserMessage, context, modelRole: modelId })
      }
    }
    const upstreamAbort = new AbortController()

    const storeTraces = settings.storeTraces === true
    if (storeTraces) res.setHeader('x-trace-storage', 'available')
    const consented = req.get('x-trace-consent') === 'yes'
    const shouldStoreTrace = storeTraces && consented

    const captureSink: UpstreamCaptureSink | undefined = shouldStoreTrace ? {} : undefined
    const captureFetch = captureSink ? createCapturingFetch(captureSink) : undefined

    const { modelConfig, inputPricePerMillion, outputPricePerMillion } = getModelConfig(settings, modelId)
    const model = resolveModelForRole(settings, modelId, captureFetch)
    // Downstream debug logging (client→gateway OpenAI exchange), scoped per provider
    // so it can be restricted to one provider: DEBUG=agents:downstream:<type>:<id>.
    // Independent of trace storage; serialisation happens only when the flag is on.
    const debugDown = createDebug(`agents:downstream:${modelConfig.provider.type}:${modelConfig.provider.id}`)
    if (debugDown.enabled) debugDown('request\n%s', JSON.stringify(req.body))
    const traceConversationId = req.get('x-trace-conversation') || undefined
    const traceContextId = req.get('x-trace-ctx') || 'unknown'
    const traceFlags = parseFlagsCookie(req.headers.cookie)
    const traceStart = Date.now()
    const recordTrace = (response: { content: string, toolCalls: { id: string, name: string, arguments: string }[], finishReason?: string }, usage: { inputTokens: number, outputTokens: number, cacheReadTokens?: number, cacheWriteTokens?: number }, timeToFirstChunkMs?: number) => {
      if (debugDown.enabled) debugDown('response %s\n%s', response.finishReason ?? '', JSON.stringify({ content: response.content, toolCalls: response.toolCalls }))
      if (!shouldStoreTrace || !traceConversationId) return
      recordTraceRequest({
        owner,
        userId: usageUserId,
        userName: usageUserName,
        conversationId: traceConversationId,
        contextId: traceContextId,
        modelRole: modelId,
        providerName: modelConfig.provider.name,
        providerType: modelConfig.provider.type,
        resolvedModel: modelConfig.id,
        body: req.body,
        response,
        usage,
        inputPricePerMillion,
        outputPricePerMillion,
        timing: { durationMs: Date.now() - traceStart, ...(timeToFirstChunkMs != null ? { timeToFirstChunkMs } : {}) },
        ...(moderation?.traceInfo() ? { moderation: moderation.traceInfo() } : {}),
        ...(traceFlags ? { flags: traceFlags } : {}),
        ...(captureSink?.response ? { upstream: { request: captureSink.request!, response: captureSink.response } } : {})
      })
    }

    // Extract system message from OpenAI messages array
    const systemMessages = messages.filter(m => m.role === 'system')
    const system = systemMessages.length > 0 ? systemMessages.map(m => m.content).join('\n') : undefined

    // Convert messages and tools
    const aiMessages = convertOpenAIMessages(messages)
    const tools = openaiTools ? convertOpenAITools(openaiTools) : {}
    const hasTools = Object.keys(tools).length > 0

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')
      res.setHeader('X-Accel-Buffering', 'no')

      // Some upstreams (Scaleway glm-5.2) drop tool_calls in streaming mode but return
      // them correctly non-streamed. When such a model is paired with tools, run the
      // upstream call non-streaming and synthesise the SSE chunks below, so the client
      // still gets a normal stream. See streamedToolCallsBroken.
      const upstreamNonStreaming = hasTools && streamedToolCallsBroken(modelConfig.provider.type, modelConfig.id)
      if (upstreamNonStreaming) debugDown('upstream non-streaming workaround active for %s/%s', modelConfig.provider.type, modelConfig.id)
      const result = upstreamNonStreaming
        ? null
        : await streamText({
          model,
          system,
          messages: aiMessages,
          temperature,
          maxOutputTokens: maxTokens,
          topP,
          stopSequences: stop,
          abortSignal: upstreamAbort.signal,
          ...(hasTools ? { tools, toolChoice: convertToolChoice(toolChoice) } : {})
        })

      // Send initial chunk with role — safe before the verdict (no content)
      res.write(`data: ${JSON.stringify({
        id: completionId,
        object: 'chat.completion.chunk',
        created,
        model: modelId,
        choices: [{ index: 0, delta: { role: 'assistant', content: '' }, finish_reason: null }]
      })}\n\n`)

      // Moderation gate: buffer content-bearing chunks until the verdict or the
      // gate timeout; on block discard them and emit a content_filter finish.
      let gateState: 'pending' | 'open' | 'blocked' = moderation ? 'pending' : 'open'
      // gateState is mutated from the gate callbacks; reading it through a closure
      // avoids TypeScript's (here incorrect) control-flow narrowing of the let.
      const gateBlocked = () => gateState === 'blocked'
      const buffered: string[] = []
      // a finish trace captured while the gate was still pending: only stored if the gate opens
      let deferredFinishTrace: (() => void) | null = null
      const sseWrite = (payload: string) => {
        if (gateState === 'blocked' || res.writableEnded) return
        if (gateState === 'pending') buffered.push(payload)
        else res.write(payload)
      }
      const endWithContentFilter = () => {
        res.write(`data: ${JSON.stringify({
          id: completionId,
          object: 'chat.completion.chunk',
          created,
          model: modelId,
          choices: [{ index: 0, delta: {}, finish_reason: 'content_filter' }]
        })}\n\n`)
        res.write('data: [DONE]\n\n')
        res.end()
      }
      if (moderation) {
        moderation.gate.then(g => {
          if (res.writableEnded || gateState !== 'pending') return
          if (g.action === 'block') {
            gateState = 'blocked'
            buffered.length = 0
            upstreamAbort.abort()
            endWithContentFilter()
            recordTrace({ content: '', toolCalls: [], finishReason: 'content_filter' }, { inputTokens: 0, outputTokens: 0 })
          } else {
            gateState = 'open'
            for (const payload of buffered) res.write(payload)
            buffered.length = 0
            deferredFinishTrace?.()
            deferredFinishTrace = null
          }
        })
        moderation.onLateBlock(() => {
          if (res.writableEnded) return
          gateState = 'blocked'
          upstreamAbort.abort()
          endWithContentFilter()
        })
      }

      // Parallel tool calls are distinguished in the OpenAI streaming wire format only by
      // their `index`. Assign a stable incrementing index per tool call id so the client
      // does not collapse several calls into a single index-0 slot.
      const toolCallIndexes = new Map<string, number>()

      try {
        let streamedText = ''
        let ttfc: number | undefined
        const streamedToolCalls = new Map<string, { id: string, name: string, arguments: string }>()
        if (upstreamNonStreaming) {
          // Non-streaming upstream: get the full completion (with the tool call the
          // streamed path would have dropped), then emit it as the same SSE chunks the
          // streaming path produces — routed through sseWrite so the moderation gate
          // still buffers/blocks identically.
          const gen = await generateText({
            model,
            system,
            messages: aiMessages,
            temperature,
            maxOutputTokens: maxTokens,
            topP,
            stopSequences: stop,
            abortSignal: upstreamAbort.signal,
            ...(hasTools ? { tools, toolChoice: convertToolChoice(toolChoice) } : {})
          })
          ttfc = Date.now() - traceStart
          if (gen.reasoningText) {
            sseWrite(`data: ${JSON.stringify({ id: completionId, object: 'chat.completion.chunk', created, model: modelId, choices: [{ index: 0, delta: { reasoning_content: gen.reasoningText }, finish_reason: null }] })}\n\n`)
          }
          if (gen.text) {
            streamedText = gen.text
            sseWrite(`data: ${JSON.stringify({ id: completionId, object: 'chat.completion.chunk', created, model: modelId, choices: [{ index: 0, delta: { content: gen.text }, finish_reason: null }] })}\n\n`)
          }
          for (const tc of gen.toolCalls ?? []) {
            const toolCallIndex = toolCallIndexes.size
            toolCallIndexes.set(tc.toolCallId, toolCallIndex)
            const args = JSON.stringify(tc.input ?? {})
            streamedToolCalls.set(tc.toolCallId, { id: tc.toolCallId, name: tc.toolName, arguments: args })
            sseWrite(`data: ${JSON.stringify({ id: completionId, object: 'chat.completion.chunk', created, model: modelId, choices: [{ index: 0, delta: { tool_calls: [{ index: toolCallIndex, id: tc.toolCallId, type: 'function', function: { name: tc.toolName, arguments: args } }] }, finish_reason: null }] })}\n\n`)
          }
          const inputTokens = gen.usage?.inputTokens ?? 0
          const outputTokens = gen.usage?.outputTokens ?? 0
          const cost = computeCost(inputTokens, outputTokens, inputPricePerMillion, outputPricePerMillion)
          if (cost > 0) await recordUsage(owner, cost, usageUserId, usageUserName, poolId)
          sseWrite(`data: ${JSON.stringify({ id: completionId, object: 'chat.completion.chunk', created, model: modelId, choices: [{ index: 0, delta: {}, finish_reason: mapFinishReason(gen.finishReason as FinishReason) }], usage: buildUsage(gen.usage) })}\n\n`)
          const recordFinishTrace = () => recordTrace(
            { content: streamedText, toolCalls: [...streamedToolCalls.values()], finishReason: mapFinishReason(gen.finishReason as FinishReason) },
            { inputTokens, outputTokens, cacheReadTokens: gen.usage?.inputTokenDetails?.cacheReadTokens, cacheWriteTokens: gen.usage?.inputTokenDetails?.cacheWriteTokens },
            ttfc
          )
          if (gateState === 'pending') deferredFinishTrace = recordFinishTrace
          else if (gateState === 'open') recordFinishTrace()
        } else {
          for await (const part of result!.fullStream) {
            if (part.type === 'error') {
            // The AI SDK surfaces a mid-stream provider failure as an in-band 'error'
            // part rather than throwing out of the for-await. Without re-throwing it the
            // loop would end normally and we'd emit a clean [DONE] with no error chunk —
            // the client would then see an empty completion and silently drop the turn.
            // Throw so the catch below emits a proper error chunk to the client.
              const e = (part as { error?: unknown }).error
              throw (e instanceof Error ? e : new Error(typeof e === 'string' ? e : 'Stream error'))
            }
            if (part.type === 'text-delta') {
              streamedText += part.text
              if (ttfc === undefined) ttfc = Date.now() - traceStart
              sseWrite(`data: ${JSON.stringify({
              id: completionId,
              object: 'chat.completion.chunk',
              created,
              model: modelId,
              choices: [{ index: 0, delta: { content: part.text }, finish_reason: null }]
            })}\n\n`)
            } else if (part.type === 'reasoning-delta') {
              // Forward reasoning tokens (captured by @ai-sdk/openai-compatible for
              // reasoning models) on the OpenAI-compatible `reasoning_content` channel so
              // the client provider parses them back as reasoning.
              if (ttfc === undefined) ttfc = Date.now() - traceStart
              sseWrite(`data: ${JSON.stringify({ id: completionId, object: 'chat.completion.chunk', created, model: modelId, choices: [{ index: 0, delta: { reasoning_content: part.text }, finish_reason: null }] })}\n\n`)
            } else if (part.type === 'tool-input-start') {
              const toolCallIndex = toolCallIndexes.size
              toolCallIndexes.set(part.id, toolCallIndex)
              streamedToolCalls.set(part.id, { id: part.id, name: part.toolName, arguments: '' })
              sseWrite(`data: ${JSON.stringify({
              id: completionId,
              object: 'chat.completion.chunk',
              created,
              model: modelId,
              choices: [{
                index: 0,
                delta: {
                  tool_calls: [{
                    index: toolCallIndex,
                    id: part.id,
                    type: 'function',
                    function: { name: part.toolName, arguments: '' }
                  }]
                },
                finish_reason: null
              }]
            })}\n\n`)
            } else if (part.type === 'tool-input-delta') {
              const toolCallIndex = toolCallIndexes.get(part.id) ?? 0
              const entry = streamedToolCalls.get(part.id)
              if (entry) entry.arguments += part.delta
              sseWrite(`data: ${JSON.stringify({
              id: completionId,
              object: 'chat.completion.chunk',
              created,
              model: modelId,
              choices: [{
                index: 0,
                delta: {
                  tool_calls: [{
                    index: toolCallIndex,
                    function: { arguments: part.delta }
                  }]
                },
                finish_reason: null
              }]
            })}\n\n`)
            } else if (part.type === 'finish') {
            // Record usage for streaming responses (money cost)
              const inputTokens = part.totalUsage?.inputTokens ?? 0
              const outputTokens = part.totalUsage?.outputTokens ?? 0
              const cost = computeCost(inputTokens, outputTokens, inputPricePerMillion, outputPricePerMillion)
              if (cost > 0) {
                await recordUsage(owner, cost, usageUserId, usageUserName, poolId)
              }

              sseWrite(`data: ${JSON.stringify({
              id: completionId,
              object: 'chat.completion.chunk',
              created,
              model: modelId,
              choices: [{ index: 0, delta: {}, finish_reason: mapFinishReason(part.finishReason as FinishReason) }],
              usage: buildUsage(part.totalUsage)
            })}\n\n`)

              const recordFinishTrace = () => recordTrace(
                { content: streamedText, toolCalls: [...streamedToolCalls.values()], finishReason: mapFinishReason(part.finishReason as FinishReason) },
                { inputTokens, outputTokens, cacheReadTokens: part.totalUsage?.inputTokenDetails?.cacheReadTokens, cacheWriteTokens: part.totalUsage?.inputTokenDetails?.cacheWriteTokens },
                ttfc
              )
              // While the gate is pending the content must not reach trace storage:
              // a block verdict records its own content-free content_filter trace.
              if (gateState === 'pending') deferredFinishTrace = recordFinishTrace
              else if (gateState === 'open') recordFinishTrace()
            }
          }
        }

        // The stream can finish while the gate is still pending (short responses):
        // wait for the verdict before releasing the end of the stream.
        if (moderation) await moderation.gate
        if (!res.writableEnded && !gateBlocked()) {
          res.write('data: [DONE]\n\n')
          res.end()
        }
      } catch (streamErr: any) {
        // An abort caused by a block verdict already ended the response.
        if (res.writableEnded || gateBlocked()) return
        const message = streamErr?.message || 'Stream error'
        res.write(`data: ${JSON.stringify({
          error: { message, type: 'server_error', code: null }
        })}\n\n`)
        res.write('data: [DONE]\n\n')
        res.end()
      }
    } else {
      let lateBlocked = false
      moderation?.onLateBlock(() => { lateBlocked = true; upstreamAbort.abort() })

      const generation = generateText({
        model,
        system,
        messages: aiMessages,
        temperature,
        maxOutputTokens: maxTokens,
        topP,
        stopSequences: stop,
        abortSignal: upstreamAbort.signal,
        ...(hasTools ? { tools, toolChoice: convertToolChoice(toolChoice) } : {})
      })
      // surfaced through the gate/result handling below; avoids an unhandled rejection
      generation.catch(() => {})

      if (moderation) {
        const g = await moderation.gate
        if (g.action === 'block') {
          upstreamAbort.abort()
          respondBlocked()
          recordTrace({ content: '', toolCalls: [], finishReason: 'content_filter' }, { inputTokens: 0, outputTokens: 0 })
          return
        }
      }

      // Two late-block outcomes: (A) the abort lands while generateText is in
      // flight and it throws, (B) generateText settles first and the verdict
      // arrives just after — both must answer with the content_filter refusal.
      let result: Awaited<typeof generation>
      try {
        result = await generation
      } catch (genErr) {
        if (lateBlocked) {
          respondBlocked()
          recordTrace({ content: '', toolCalls: [], finishReason: 'content_filter' }, { inputTokens: 0, outputTokens: 0 })
          return
        }
        throw genErr
      }
      if (lateBlocked) {
        respondBlocked()
        recordTrace({ content: '', toolCalls: [], finishReason: 'content_filter' }, { inputTokens: 0, outputTokens: 0 })
        return
      }

      // Record usage (money cost)
      const inputTokens = result.usage?.inputTokens ?? 0
      const outputTokens = result.usage?.outputTokens ?? 0
      const cost = computeCost(inputTokens, outputTokens, inputPricePerMillion, outputPricePerMillion)
      if (cost > 0) {
        await recordUsage(owner, cost, usageUserId, usageUserName, poolId)
      }

      // Build response message
      const responseMessage: { role: string, content: string | null, reasoning_content?: string, tool_calls?: Array<{ id: string, type: string, function: { name: string, arguments: string } }> } = {
        role: 'assistant',
        content: result.text || null
      }
      if (result.reasoningText) responseMessage.reasoning_content = result.reasoningText

      // Include tool calls if present
      if (result.toolCalls && result.toolCalls.length > 0) {
        responseMessage.tool_calls = result.toolCalls.map((tc: { toolCallId: string, toolName: string, input?: unknown }) => ({
          id: tc.toolCallId,
          type: 'function',
          function: {
            name: tc.toolName,
            arguments: JSON.stringify(tc.input ?? {})
          }
        }))
      }

      res.json({
        id: completionId,
        object: 'chat.completion',
        created,
        model: modelId,
        choices: [{
          index: 0,
          message: responseMessage,
          finish_reason: mapFinishReason(result.finishReason as FinishReason)
        }],
        usage: buildUsage(result.usage)
      })

      recordTrace(
        {
          content: result.text || '',
          toolCalls: (result.toolCalls ?? []).map((tc: { toolCallId: string, toolName: string, input?: unknown }) => ({ id: tc.toolCallId, name: tc.toolName, arguments: JSON.stringify(tc.input ?? {}) })),
          finishReason: mapFinishReason(result.finishReason as FinishReason)
        },
        { inputTokens, outputTokens, cacheReadTokens: result.usage?.inputTokenDetails?.cacheReadTokens, cacheWriteTokens: result.usage?.inputTokenDetails?.cacheWriteTokens }
      )
    }
  } catch (err) {
    next(err)
  }
})
