export default {
  $id: 'https://github.com/data-fair/agents/conversation-message',
  'x-exports': ['types'],
  title: 'Conversation message',
  type: 'object',
  additionalProperties: false,
  required: ['id', 'conversationId', 'agentId', 'owner', 'seq', 'role', 'author', 'createdAt'],
  properties: {
    id: { type: 'string' },
    conversationId: { type: 'string' },
    agentId: { type: 'string' },
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
     * The turn's content, as the AI SDK's ORDERED UIMessagePart list.
     *
     * The library owns this contract: `UIMessagePart` from `ai`, converted to model messages by
     * `convertToModelMessages` and validated by `validateUIMessages`. It replaced a hand-written union
     * that had already drifted three ways (two hand copies plus this schema, each missing a different
     * field) and that made a failing tool indistinguishable in shape from a successful one.
     *
     * Deliberately LOOSE here, and not `additionalProperties: false`: the precise state machine —
     * input-streaming -> input-available -> approval-requested/responded -> output-available |
     * output-error | output-denied, with the fields each state permits — belongs to the library, which
     * also ships the validator. Restating it here would recreate exactly the drift this replaced, and
     * would reject a part the library legitimately widens.
     *
     * ORDER IS LOAD-BEARING. A turn interleaves steps, and `convertToModelMessages` reconstructs the
     * `assistant(tool-call) -> tool(tool-result)` sequence from it, dropping a call whose result never
     * arrived (`ignoreIncompleteToolCalls`) rather than emitting one alone, which providers reject.
     *
     * `dynamic-tool` rather than the statically-typed `tool-<name>`: an agent's tools are discovered
     * from its MCP servers at runtime, so the names are not known to the type system.
     */
    /**
     * The turn's ordered parts. OPAQUE here, deliberately.
     *
     * This schema used to restate the AI SDK's `UIMessagePart` union field by field — text, toolName,
     * toolCallId, state, input, output, toolMetadata, approval — which made it a hand-maintained copy
     * of a type the library already owns and evolves. It exported `{ type: string, ... }`, so the
     * executor had to cast `parts as any` at every write, and the test fixtures could build parts the
     * SDK would reject (a `dynamic-tool` with no `toolCallId`) without anything noticing.
     *
     * This schema is `x-exports: ['types']` — a type source, never a runtime validator — so nothing
     * is lost by not describing the shape: `safeValidateUIMessages` validates it against the
     * library's own definition on the way back in, which is a stronger check than this ever was. The
     * TYPE comes from `shared/message-parts.ts` via the collection's element type (see mongo.ts).
     */
    parts: {
      type: 'array',
      default: []
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
