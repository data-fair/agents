import { tool, jsonSchema } from 'ai'
import type { Tool } from 'ai'
import type { SessionRecorder, TraceOverviewEntry } from './session-recorder.js'

const PHYSICAL_REQUEST_SUMMARY_PROMPT = `You analyze a single physical LLM request payload (the full cumulative context that was sent to the model). Produce three sections:

1. Context composition — the system prompt size, how many messages and of which roles, the bulk taken by tool definitions, and the size of tool-result payloads. Quantify what fills the context.
2. Waste / optimization signals — stale or repeated tool results, boilerplate that recurs across turns, large rarely-used tool schemas, and content that compaction could safely drop.
3. Faithful content digest — a neutral, readable summary of the actual conversation in this request (what the user, assistant, and tools said), so the reader can judge behaviour without reading the raw payload.

Be concise and specific.`

export function buildEvaluatorTools (
  recorder: SessionRecorder,
  opts: { accountType: string; accountId: string; apiPath: string }
): Record<string, Tool> {
  return {
    getTraceOverview: tool({
      description: 'List all trace entries in chronological order. Returns index, type, timestamp, label, and preview for each entry.',
      inputSchema: jsonSchema({
        type: 'object',
        properties: {},
        required: []
      }),
      execute: async () => {
        const overview = recorder.getTraceOverview()
        return overview.map((e: TraceOverviewEntry) =>
          `[${e.index}] ${e.type} | ${e.timestamp.toISOString()} | ${e.label} | ${e.preview}`
        ).join('\n')
      }
    }),

    getTraceEntry: tool({
      description: 'Get full detail for one trace entry by its index.',
      inputSchema: jsonSchema({
        type: 'object',
        properties: {
          index: { type: 'number', description: 'The index of the trace entry to retrieve' }
        },
        required: ['index']
      }),
      execute: async (args: { index: number }) => {
        const entry = recorder.getTraceEntry(args.index)
        if (!entry) return 'Entry not found'
        return JSON.stringify(entry, null, 2)
      }
    }),

    getTraceEntries: tool({
      description: 'Get a range of trace entries in full detail.',
      inputSchema: jsonSchema({
        type: 'object',
        properties: {
          fromIndex: { type: 'number', description: 'Start index (inclusive)' },
          toIndex: { type: 'number', description: 'End index (inclusive)' }
        },
        required: ['fromIndex', 'toIndex']
      }),
      execute: async (args: { fromIndex: number; toIndex: number }) => {
        const entries = recorder.getTraceEntries(args.fromIndex, args.toIndex)
        return JSON.stringify(entries, null, 2)
      }
    }),

    getSessionConfig: tool({
      description: 'Get the system prompt and tools definitions for the session.',
      inputSchema: jsonSchema({
        type: 'object',
        properties: {},
        required: []
      }),
      execute: async () => {
        const trace = recorder.getTrace()
        const latestTools = trace.toolSnapshots.length > 0
          ? trace.toolSnapshots[trace.toolSnapshots.length - 1]
          : []
        return JSON.stringify({
          systemPrompt: trace.systemPrompt,
          tools: latestTools
        }, null, 2)
      }
    }),

    summarizePhysicalRequest: tool({
      description: 'Summarize a large physical-request entry (its full cumulative context) via a one-shot summarizer call. Use this instead of getTraceEntry when a physical-request payload is too large to read directly. Returns context composition, waste/optimization signals, and a faithful content digest.',
      inputSchema: jsonSchema({
        type: 'object',
        properties: {
          index: { type: 'number', description: 'The index of the physical-request trace entry to summarize' }
        },
        required: ['index']
      }),
      execute: async (args: { index: number }) => {
        const entry = recorder.getTraceEntry(args.index)
        if (!entry) return 'Entry not found'
        if (entry.type !== 'physical-request') {
          return `Entry ${args.index} is not a physical-request entry (it is ${entry.type}). Use getTraceEntry instead.`
        }
        // The summary endpoint pins its own system prompt, so we frame the
        // analysis instructions into the content itself.
        const content = `${PHYSICAL_REQUEST_SUMMARY_PROMPT}\n\nPayload to analyze:\n${JSON.stringify(entry.content.requestBody)}`
        const res = await fetch(
          `${window.location.origin}${opts.apiPath}/summary/${opts.accountType}/${opts.accountId}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ content })
          }
        )
        if (!res.ok) return `Summary failed (HTTP ${res.status})`
        const { summary } = await res.json()
        return summary
      }
    })
  }
}
