import { tool, jsonSchema } from 'ai'
import type { Tool } from 'ai'
import type { SessionRecorder, TraceOverviewEntry } from './session-recorder.js'
import { lookupArchitectureDoc } from './architecture-docs-lookup.js'
import { buildSourceTools } from './source-tools.js'

const PHYSICAL_REQUEST_SUMMARY_PROMPT = `You analyze a single physical LLM request payload (the full cumulative context that was sent to the model). Produce three sections:

1. Context composition — the system prompt size, how many messages and of which roles, the bulk taken by tool definitions, and the size of tool-result payloads. Quantify what fills the context.
2. Waste / optimization signals — stale or repeated tool results, boilerplate that recurs across turns, large rarely-used tool schemas, and content that compaction could safely drop.
3. Faithful content digest — a neutral, readable summary of the actual conversation in this request (what the user, assistant, and tools said), so the reader can judge behaviour without reading the raw payload.

Be concise and specific.`

export function buildEvaluatorTools (
  recorder: SessionRecorder,
  opts: { accountType: string; accountId: string; apiPath: string; architectureDocs?: Record<string, string>; architectureTopics?: string[]; includeSourceTools?: boolean },
  recorderB?: SessionRecorder
): Record<string, Tool> {
  // Docs are injected (not imported) so this module — which is exercised by
  // the non-Vite unit test runner — never pulls in the Vite-only
  // architecture-docs.ts (import.meta.glob). EvaluatorChat.vue passes the
  // bundled docs; tests omit them and get an empty set.
  const architectureDocs = opts.architectureDocs ?? {}
  const architectureTopics = opts.architectureTopics ?? Object.keys(architectureDocs).sort()

  // Compare mode: a second trace is loaded. Each trace-scoped tool gains a
  // required `trace` selector and routes to the matching recorder. Single-trace
  // mode keeps the exact pre-existing shape (no selector).
  const compare = !!recorderB
  const traceProps: Record<string, object> = compare
    ? { trace: { type: 'string', enum: ['A', 'B'], description: 'Which trace to inspect: A (the trace under review) or B (the comparison trace).' } }
    : {}
  const traceRequired: string[] = compare ? ['trace'] : []
  const pickRecorder = (args: { trace?: 'A' | 'B' }): SessionRecorder => {
    if (!compare) return recorder
    if (args.trace === 'B') return recorderB!
    if (args.trace === 'A') return recorder
    throw new Error('The `trace` parameter (A or B) is required when comparing two traces.')
  }
  const note = compare ? ' Two traces are loaded (A and B); pass the `trace` parameter to choose which one.' : ''

  const baseTools: Record<string, Tool> = {
    getTraceOverview: tool({
      description: 'List all trace entries in chronological order. Returns index, type, timestamp, label, and preview for each entry.' + note,
      inputSchema: jsonSchema({
        type: 'object',
        properties: { ...traceProps },
        required: [...traceRequired]
      }),
      execute: async (args: { trace?: 'A' | 'B' }) => {
        const overview = pickRecorder(args).getTraceOverview()
        return overview.map((e: TraceOverviewEntry) =>
          `[${e.index}] ${e.type} | ${e.timestamp.toISOString()} | ${e.label} | ${e.preview}`
        ).join('\n')
      }
    }),

    getTraceEntry: tool({
      description: 'Get full detail for one trace entry by its index.' + note,
      inputSchema: jsonSchema({
        type: 'object',
        properties: {
          index: { type: 'number', description: 'The index of the trace entry to retrieve' },
          ...traceProps
        },
        required: ['index', ...traceRequired]
      }),
      execute: async (args: { index: number; trace?: 'A' | 'B' }) => {
        const entry = pickRecorder(args).getTraceEntry(args.index)
        if (!entry) return 'Entry not found'
        return JSON.stringify(entry, null, 2)
      }
    }),

    getTraceEntries: tool({
      description: 'Get a range of trace entries in full detail.' + note,
      inputSchema: jsonSchema({
        type: 'object',
        properties: {
          fromIndex: { type: 'number', description: 'Start index (inclusive)' },
          toIndex: { type: 'number', description: 'End index (inclusive)' },
          ...traceProps
        },
        required: ['fromIndex', 'toIndex', ...traceRequired]
      }),
      execute: async (args: { fromIndex: number; toIndex: number; trace?: 'A' | 'B' }) => {
        const entries = pickRecorder(args).getTraceEntries(args.fromIndex, args.toIndex)
        return JSON.stringify(entries, null, 2)
      }
    }),

    getUpstreamExchange: tool({
      description: 'Get the raw gateway→provider (upstream) request and response for a physical-request entry by its index. Use this to see exactly what was sent to the provider and the raw bytes it returned — including reasoning the assistant-facing response may omit (e.g. an empty turn with non-zero output tokens). Only available when the upstream was captured at record time.' + note,
      inputSchema: jsonSchema({
        type: 'object',
        properties: { index: { type: 'number', description: 'The index of the physical-request entry' }, ...traceProps },
        required: ['index', ...traceRequired]
      }),
      execute: async (args: { index: number; trace?: 'A' | 'B' }) => {
        const up = pickRecorder(args).getUpstreamExchange(args.index)
        if (!up) return `No upstream exchange for entry ${args.index} (it may not be a physical request, or upstream capture was off for this session).`
        // distinct name — `note` is already the compare-mode suffix in the enclosing scope
        const truncatedNote = up.response.truncated ? `\n…[truncated, ${up.response.rawChars} total chars]` : ''
        return `Upstream request → ${up.request.url}\n${JSON.stringify(up.request.body, null, 2)}\n\nUpstream response (HTTP ${up.response.status}):\n${up.response.raw}${truncatedNote}`
      }
    }),

    getSessionConfig: tool({
      description: 'Get the system prompt and tools definitions for the session.' + note,
      inputSchema: jsonSchema({
        type: 'object',
        properties: { ...traceProps },
        required: [...traceRequired]
      }),
      execute: async (args: { trace?: 'A' | 'B' }) => {
        const trace = pickRecorder(args).getTrace()
        const latestTools = trace.toolSnapshots.length > 0
          ? trace.toolSnapshots[trace.toolSnapshots.length - 1]
          : []
        return JSON.stringify({
          systemPrompt: trace.systemPrompt,
          tools: latestTools
        }, null, 2)
      }
    }),

    readArchitectureDoc: tool({
      description: `Read one of this platform's architecture docs to understand how a feature actually behaves before judging it. Available topics: ${architectureTopics.join(', ')}.`,
      inputSchema: jsonSchema({
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            // Constrain to the real doc names so the model picks a valid topic
            // directly. The topics are also listed in the description above —
            // do NOT instruct the model to "pass an unknown topic to discover
            // them": the enum rejects unknown values before execute() runs, so
            // that round-trip only produces repeated validation errors.
            enum: architectureTopics,
            description: 'The architecture doc to read (filename without extension)'
          }
        },
        required: ['topic']
      }),
      execute: async (args: { topic: string }) => lookupArchitectureDoc(architectureDocs, args.topic)
    }),

    summarizePhysicalRequest: tool({
      description: 'Summarize a large physical-request entry (its full cumulative context) via a one-shot summarizer call. Use this instead of getTraceEntry when a physical-request payload is too large to read directly. Returns context composition, waste/optimization signals, and a faithful content digest.' + note,
      inputSchema: jsonSchema({
        type: 'object',
        properties: {
          index: { type: 'number', description: 'The index of the physical-request trace entry to summarize' },
          ...traceProps
        },
        required: ['index', ...traceRequired]
      }),
      execute: async (args: { index: number; trace?: 'A' | 'B' }) => {
        const entry = pickRecorder(args).getTraceEntry(args.index)
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

  if (opts.includeSourceTools) Object.assign(baseTools, buildSourceTools({ apiPath: opts.apiPath }))
  return baseTools
}
