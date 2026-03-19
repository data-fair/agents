import { tool, jsonSchema } from 'ai'
import type { Tool } from 'ai'
import type { SessionRecorder, TraceOverviewEntry } from './session-recorder.js'

export function buildEvaluatorTools (recorder: SessionRecorder): Record<string, Tool> {
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
    })
  }
}
