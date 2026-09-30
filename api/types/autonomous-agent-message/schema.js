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
    parts: {
      type: 'array',
      default: [],
      items: {
        type: 'object',
        required: ['type'],
        properties: {
          type: { type: 'string' },
          // text / reasoning
          text: { type: 'string' },
          // dynamic-tool
          toolName: { type: 'string' },
          toolCallId: { type: 'string' },
          state: { type: 'string' },
          // Declared without a type on purpose. A tool's arguments and its result are whatever its own
          // schema says — the library types both as `unknown` — but they must be DECLARED, or a
          // validator that strips unknown properties would silently empty every tool call in the
          // record. `input` in particular is what makes a call replayable and auditable.
          input: { description: "The tool call's arguments, as the tool's own schema defines them." },
          output: { description: "The tool's result, as the tool's own schema defines it." },
          providerExecuted: { type: 'boolean' },
          errorText: { type: 'string' },
          /**
           * Where this project's own per-invocation facts live, which is what the library's open
           * `toolMetadata` slot is for:
           *  - `serverId`: which catalog MCP server ran the tool, so the record names its provenance;
           *  - `truncated`: that the result was bounded, with its original size.
           */
          toolMetadata: { type: 'object', additionalProperties: true },
          /**
           * The approval record for a tool call: the library's `needsApproval` gate, which is what P1's
           * write-approval feature is built on rather than a bespoke mechanism. Never written yet.
           */
          approval: { type: 'object', additionalProperties: true }
        }
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
