// The frames the server sends on the agent session socket (shared/agent-session-protocol.ts).
//
// Typed only: our own server produces them, and the browser reads them leniently — it dispatches on
// `type` and ignores a type it does not know (a newer server talking to an older tab, normal during a
// deploy).

const parts = { type: 'array', items: {}, tsType: 'import("@agents/shared/message-parts").MessagePart[]' }

export default {
  $id: 'https://github.com/data-fair/agents/agent-session-server-frame',
  'x-exports': ['types'],
  title: 'Agent session server frame',
  type: 'object',
  oneOf: [
    {
      title: 'Attached frame',
      description: 'The answer to a `hello`, and the news that a first prompt created a thread: `conversationId` is the thread this connection is bound to, absent while the next prompt is still to create one. `reviewOffered` is what makes the chat show its consent sheet.',
      type: 'object',
      additionalProperties: false,
      required: ['type', 'anonymous'],
      properties: {
        type: { const: 'attached' },
        conversationId: { type: 'string' },
        anonymous: { type: 'boolean' },
        reviewOffered: { type: 'boolean' }
      }
    },
    {
      title: 'Delta frame',
      description: 'Token stream of the turn in progress.',
      type: 'object',
      additionalProperties: false,
      required: ['type', 'kind', 'text'],
      properties: {
        type: { const: 'delta' },
        kind: { type: 'string', enum: ['text', 'reasoning'] },
        text: { type: 'string' }
      }
    },
    {
      title: 'Tool call frame',
      description: 'Run this contextual tool and answer with a `tool-result` carrying the same callId.',
      type: 'object',
      additionalProperties: false,
      required: ['type', 'callId', 'name', 'input'],
      properties: {
        type: { const: 'tool-call' },
        callId: { type: 'string' },
        name: { type: 'string' },
        input: {}
      }
    },
    {
      title: 'Message frame',
      description: 'The turn as it stands, as STORED PARTS: the same parts the model is replayed from, so the live chat and a reopened thread render through one mapper. Throttled on the partial persist\'s clock.',
      type: 'object',
      additionalProperties: false,
      required: ['type', 'seq', 'role', 'parts', 'pending'],
      properties: {
        type: { const: 'message' },
        seq: { type: 'number' },
        role: { type: 'string', enum: ['user', 'assistant'] },
        parts,
        pending: { type: 'boolean' }
      }
    },
    {
      title: 'Activity frame',
      description: 'What the assistant is doing right now, in the vocabulary the chat renders; null means idle.',
      type: 'object',
      additionalProperties: false,
      required: ['type', 'activity'],
      properties: {
        type: { const: 'activity' },
        activity: { tsType: 'import("@agents/shared/agent-activity").ChatActivity | null' }
      }
    },
    {
      title: 'Trace frame',
      description: 'A code_mode script\'s nested calls, as stored parts, under the call that ran it. Never something the model reads.',
      type: 'object',
      additionalProperties: false,
      required: ['type', 'parentToolCallId', 'name', 'parts', 'pending'],
      properties: {
        type: { const: 'trace' },
        parentToolCallId: { type: 'string' },
        name: { type: 'string' },
        parts,
        pending: { type: 'boolean' }
      }
    },
    {
      title: 'Turn end frame',
      type: 'object',
      additionalProperties: false,
      required: ['type', 'stopReason'],
      properties: {
        type: { const: 'turn-end' },
        stopReason: { type: 'string' },
        detail: { type: 'string' }
      }
    },
    {
      title: 'Cost frame',
      description: 'What this conversation has cost so far, in credits, summed from its runs. Sent once attached and again before each `turn-end`.',
      type: 'object',
      additionalProperties: false,
      required: ['type', 'conversationCost'],
      properties: {
        type: { const: 'cost' },
        conversationCost: { type: 'number' }
      }
    },
    {
      title: 'Error frame',
      description: 'A refusal or a failure, with the HTTP status it would have had: 400 a malformed frame, 401 a refused anonymous token, 403 not allowed, 404 an unknown conversation, approval or tool call, 409 a conflict (a decision already taken, a turn still finishing, the thread opened elsewhere), 503 the service is restarting (send again), 500 anything else.',
      type: 'object',
      additionalProperties: false,
      required: ['type', 'status', 'message'],
      properties: {
        type: { const: 'error' },
        status: { type: 'integer' },
        message: { type: 'string' }
      }
    }
  ]
}
