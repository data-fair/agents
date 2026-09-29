export default {
  $id: 'https://github.com/data-fair/agents/autonomous-agent-message',
  'x-exports': ['types'],
  title: 'Autonomous agent message',
  type: 'object',
  additionalProperties: false,
  required: ['id', 'conversationId', 'autonomousAgentId', 'owner', 'seq', 'role', 'author', 'createdAt'],
  properties: {
    id: { type: 'string' },
    conversationId: { type: 'string' },
    autonomousAgentId: { type: 'string' },
    owner: {
      type: 'object',
      additionalProperties: false,
      required: ['type', 'id'],
      properties: {
        type: { type: 'string', enum: ['organization'] },
        id: { type: 'string' },
        name: { type: 'string' },
        department: { type: 'string' }
      }
    },
    seq: { type: 'number', minimum: 1 },
    role: { type: 'string', enum: ['user', 'assistant'] },
    // Mandatory. A shared timeline means several people contribute, so an unattributed
    // message is unreadable and un-erasable.
    author: {
      type: 'object',
      additionalProperties: false,
      required: ['kind'],
      properties: {
        kind: { type: 'string', enum: ['user', 'autonomous-agent'] },
        userId: { type: 'string' },
        userName: { type: 'string' }
      }
    },
    /**
     * The turn's content, as ORDERED model-message parts.
     *
     * This is the whole point of the storage model: what is stored must be sufficient to reconstruct
     * exactly what the model saw, without inference and without a second source. The previous shape
     * kept `content` plus tool calls as name-and-arguments and never the RESULTS, so a resumed
     * conversation replayed `{role:'assistant',content:'done'}` for a turn that had called a tool —
     * the model saw neither the result nor the fact that it had acted.
     *
     * ORDER IS LOAD-BEARING. A turn interleaves steps (call, result, call, result, text), and
     * `loadHistory` groups consecutive runs back into the `assistant` / `tool` message sequence the
     * provider requires. A set would not round-trip; a list does.
     *
     * `tool-result` parts live on the assistant turn that produced them rather than in their own
     * stored message, so one stored message stays one visible turn for the UI, and the split into
     * model messages happens at load time.
     */
    parts: {
      type: 'array',
      default: [],
      items: {
        type: 'object',
        unevaluatedProperties: false,
        discriminator: { propertyName: 'type' },
        required: ['type'],
        oneOf: [{
          title: 'Text',
          required: ['type', 'text'],
          properties: {
            type: { const: 'text' },
            text: { type: 'string' }
          }
        }, {
          title: 'Reasoning',
          required: ['type', 'text'],
          properties: {
            type: { const: 'reasoning' },
            text: { type: 'string' }
          }
        }, {
          title: 'Tool call',
          required: ['type', 'toolName'],
          properties: {
            type: { const: 'tool-call' },
            toolCallId: { type: 'string' },
            toolName: { type: 'string' },
            serverId: { type: 'string' },
            // What the agent asked the tool to DO. Knowing only that a tool was called is far
            // weaker: this is what makes a write auditable and an injection visible after the fact,
            // and it is what P1's approval gate will show a reviewer.
            arguments: { type: 'string' },
            // readOnlyHint / destructiveHint, recorded per call so the write surface is
            // queryable before P1's approval gate is switched on
            annotations: { type: 'object', additionalProperties: true }
          }
        }, {
          title: 'Tool result',
          required: ['type', 'toolName'],
          properties: {
            type: { const: 'tool-result' },
            toolCallId: { type: 'string' },
            toolName: { type: 'string' },
            // Bounded (see TOOL_RESULT_LIMIT). The bound is large enough to be rarely reached, and
            // when it is, `truncated` records it and the marker travels inside `result` — so a model
            // reading this on revival is TOLD it is seeing a trimmed result rather than handed a
            // silently short one.
            result: { type: 'string' },
            truncated: {
              type: 'object',
              additionalProperties: false,
              required: ['totalChars'],
              properties: { totalChars: { type: 'number', minimum: 0 } }
            },
            // The tool was called and did NOT return a usable result. The pair still has to exist,
            // or the history is one the provider rejects — so a failure is a result carrying the
            // error, never an absent part.
            failed: { type: 'boolean' },
            error: { type: 'string' }
          }
        }]
      }
    },
    runId: { type: 'string' },
    // true while the executor is still appending to this message
    pending: { type: 'boolean' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    // The conversation version at which this message last changed. `?sinceVersion=` filters on
    // it, which is what makes an IN-PLACE update (the assistant message being filled in, at an
    // unchanged seq) visible to an incremental fetch — `seq` alone can only reveal new messages.
    version: { type: 'number', minimum: 1 }
  }
}
