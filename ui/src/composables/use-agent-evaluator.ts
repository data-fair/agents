import { ref, computed, onScopeDispose } from 'vue'
import { streamText, generateText, stepCountIs, tool, jsonSchema } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import type { ModelMessage, Tool } from 'ai'
import { bridgeWebMCPTools, useAgentTools } from './use-agent-tools'
import type { AgentTool } from './use-agent-tools'
import { $apiPath, $fetch } from '~/context'

export interface EvaluationTask {
  initialPrompt: string
  idealResult: string
  userDescription?: string
  maxTurns?: number
}

export interface EvaluationResult {
  taskIndex: number
  initialPrompt: string
  conversation: Array<{ role: 'user' | 'assistant'; content: string }>
  finalResponse: string
  rankings: {
    quality: number
    efficiency: number
  }
  summary: string
  suggestions: string[]
}

export type EvaluatorStatus = 'idle' | 'running' | 'scoring' | 'done' | 'error'

const checkCompletionTool = tool({
  description: 'Check if the conversation has reached a satisfactory conclusion relative to the goal.',
  inputSchema: jsonSchema({
    type: 'object',
    properties: {
      done: { type: 'boolean', description: 'Whether the assistant has satisfactorily completed the task' },
      reason: { type: 'string', description: 'Brief explanation of why the task is or is not complete' }
    },
    required: ['done', 'reason']
  })
})

const scoringTool = tool({
  description: 'Score the quality and efficiency of the assistant conversation.',
  inputSchema: jsonSchema({
    type: 'object',
    properties: {
      quality: { type: 'number', description: 'Quality score 0-100: how well the response matches the ideal result' },
      efficiency: { type: 'number', description: 'Efficiency score 0-100: how efficiently the assistant reached the result' },
      summary: { type: 'string', description: 'Brief summary of the evaluation' },
      suggestions: { type: 'array', items: { type: 'string' }, description: 'Suggestions for improvement' }
    },
    required: ['quality', 'efficiency', 'summary', 'suggestions']
  })
})

export function useAgentEvaluator (externalTools?: Record<string, Tool>) {
  // @ts-ignore
  if (import.meta.env?.SSR) return

  const status = ref<EvaluatorStatus>('idle')
  const currentTaskIndex = ref(0)
  const currentTurn = ref(0)
  const conversation = ref<Array<{ role: 'user' | 'assistant'; content: string }>>([])
  const results = ref<EvaluationResult[]>([])
  const error = ref<string | null>(null)

  let abortController: AbortController | null = null

  // Capture agent tools at setup time
  let agentToolsRef: Record<string, AgentTool> = {}
  try {
    agentToolsRef = useAgentTools()
  } catch {
    // No agent tools plugin installed
  }

  const provider = createOpenAI({
    baseURL: `${window.location.origin}${$apiPath}/gateway/v1`,
    apiKey: 'unused'
  })

  const overallQuality = computed(() => {
    if (results.value.length === 0) return 0
    return Math.round(results.value.reduce((sum, r) => sum + r.rankings.quality, 0) / results.value.length)
  })

  const overallEfficiency = computed(() => {
    if (results.value.length === 0) return 0
    return Math.round(results.value.reduce((sum, r) => sum + r.rankings.efficiency, 0) / results.value.length)
  })

  onScopeDispose(() => {
    if (abortController) {
      abortController.abort()
      abortController = null
    }
  })

  async function runEvaluation (tasks: EvaluationTask[]) {
    if (status.value === 'running' || status.value === 'scoring') return

    status.value = 'running'
    error.value = null
    results.value = []
    currentTaskIndex.value = 0
    currentTurn.value = 0
    conversation.value = []

    abortController = new AbortController()

    try {
      for (let i = 0; i < tasks.length; i++) {
        if (abortController.signal.aborted) break

        currentTaskIndex.value = i
        const task = tasks[i]
        const maxTurns = Math.min(task.maxTurns || 5, 10)
        const result = await runSingleTask(task, i, maxTurns)
        results.value.push(result)
      }

      status.value = 'done'
    } catch (err: any) {
      if (err.name === 'AbortError') {
        status.value = 'idle'
        return
      }
      console.error('Evaluator error:', err)
      error.value = err.message || 'Unknown error'
      status.value = 'error'
    } finally {
      abortController = null
    }
  }

  async function runSingleTask (task: EvaluationTask, taskIndex: number, maxTurns: number): Promise<EvaluationResult> {
    const signal = abortController!.signal
    const tools = { ...bridgeWebMCPTools(agentToolsRef), ...externalTools }
    const hasTools = Object.keys(tools).length > 0

    const taskConversation: Array<{ role: 'user' | 'assistant'; content: string }> = []
    let history: ModelMessage[] = []
    let currentPrompt = task.initialPrompt

    // Multi-turn conversation loop
    for (let turn = 0; turn < maxTurns; turn++) {
      if (signal.aborted) throw new DOMException('Aborted', 'AbortError')

      currentTurn.value = turn
      taskConversation.push({ role: 'user', content: currentPrompt })
      conversation.value = [...taskConversation]

      // Send to assistant via streamText
      history.push({ role: 'user', content: currentPrompt })

      const streamResult = streamText({
        model: provider.chat('assistant'),
        messages: history,
        tools: hasTools ? tools : undefined,
        stopWhen: stepCountIs(10),
        abortSignal: signal
      })

      let fullResponse = ''
      for await (const part of streamResult.fullStream) {
        if (part.type === 'text-delta') {
          fullResponse += part.text
        }
      }

      // Update history with response messages
      const response = await streamResult.response
      history = history.concat(response.messages)

      taskConversation.push({ role: 'assistant', content: fullResponse })
      conversation.value = [...taskConversation]

      // Check completion via evaluator model
      const completionCheck = await generateText({
        model: provider.chat('evaluator'),
        system: `You are evaluating whether a conversation has reached a satisfactory conclusion.
Conversation goal: ${task.idealResult}
Use the checkCompletion tool to indicate if the assistant has completed the task or if the conversation should continue.`,
        prompt: `Last assistant response: ${fullResponse}`,
        tools: { checkCompletion: checkCompletionTool },
        toolChoice: { type: 'tool', toolName: 'checkCompletion' },
        abortSignal: signal
      })

      const toolResult = (completionCheck.toolCalls[0] as any)?.args as { done: boolean; reason: string } | undefined
      if (toolResult?.done) {
        break
      }

      // Simulate next user message if not done and not last turn
      if (turn < maxTurns - 1) {
        const userSim = await generateText({
          model: provider.chat('evaluator'),
          system: task.userDescription || 'You are a user interacting with an assistant. Continue the conversation naturally based on the goal.',
          messages: taskConversation.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
          abortSignal: signal
        })
        currentPrompt = userSim.text
      }
    }

    // Score the conversation
    status.value = 'scoring'
    const finalResponse = taskConversation.filter(m => m.role === 'assistant').pop()?.content || ''

    const scoring = await generateText({
      model: provider.chat('evaluator'),
      system: `You are evaluating the quality and efficiency of an AI assistant conversation.
Score quality (0-100) based on how well the final result matches the ideal.
Score efficiency (0-100) based on how directly the assistant reached the result.
Use the score tool to provide your evaluation.`,
      prompt: `Ideal result: ${task.idealResult}

Conversation:
${taskConversation.map(m => `${m.role}: ${m.content}`).join('\n\n')}`,
      tools: { score: scoringTool },
      toolChoice: { type: 'tool', toolName: 'score' },
      abortSignal: signal
    })

    const scores = (scoring.toolCalls[0] as any)?.args as { quality: number; efficiency: number; summary: string; suggestions: string[] } | undefined

    status.value = 'running'

    return {
      taskIndex,
      initialPrompt: task.initialPrompt,
      conversation: taskConversation,
      finalResponse,
      rankings: {
        quality: scores?.quality ?? 50,
        efficiency: scores?.efficiency ?? 50
      },
      summary: scores?.summary ?? '',
      suggestions: scores?.suggestions ?? []
    }
  }

  async function evaluateTrace (traceId: string, idealResult: string) {
    if (status.value === 'running' || status.value === 'scoring') return

    status.value = 'scoring'
    error.value = null
    abortController = new AbortController()

    try {
      const traceData = await $fetch(`/evaluator/traces/${traceId}`)
      const traceEvents = traceData.results || []

      const scoring = await generateText({
        model: provider.chat('evaluator'),
        system: `You are evaluating an existing conversation trace.
Score quality (0-100) based on how well the result matches the ideal.
Score efficiency (0-100) based on the efficiency of the conversation.
Use the score tool to provide your evaluation.`,
        prompt: `Ideal result: ${idealResult}

Trace events: ${JSON.stringify(traceEvents)}`,
        tools: { score: scoringTool },
        toolChoice: { type: 'tool', toolName: 'score' },
        abortSignal: abortController.signal
      })

      const scores = (scoring.toolCalls[0] as any)?.args as { quality: number; efficiency: number; summary: string; suggestions: string[] } | undefined

      const result: EvaluationResult = {
        taskIndex: 0,
        initialPrompt: '',
        conversation: [],
        finalResponse: '',
        rankings: {
          quality: scores?.quality ?? 50,
          efficiency: scores?.efficiency ?? 50
        },
        summary: scores?.summary ?? '',
        suggestions: scores?.suggestions ?? []
      }

      results.value = [result]
      status.value = 'done'
    } catch (err: any) {
      if (err.name === 'AbortError') {
        status.value = 'idle'
        return
      }
      console.error('Trace evaluation error:', err)
      error.value = err.message || 'Unknown error'
      status.value = 'error'
    } finally {
      abortController = null
    }
  }

  function abort () {
    if (abortController) {
      abortController.abort()
      abortController = null
      status.value = 'idle'
    }
  }

  return {
    status,
    currentTaskIndex,
    currentTurn,
    conversation,
    results,
    overallQuality,
    overallEfficiency,
    error,
    runEvaluation,
    evaluateTrace,
    abort
  }
}

export default useAgentEvaluator
