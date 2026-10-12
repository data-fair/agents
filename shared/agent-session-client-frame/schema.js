// The frames a browser sends on the agent session socket (shared/agent-session-protocol.ts).
//
// Strict on purpose: this is a browser-facing surface, so anything not declared is refused, with the
// field that was wrong named in the refusal (the `errorMessage`s below are what the client is told).
// Unknown properties are stripped rather than refused (`removeAdditional`), as they always were.
// The one rule a schema cannot state — tool names unique within a list — is checked by
// `parseClientMessage` right after this validator.
//
// The generated validator (.type/validate.js, ajv standalone) is ESM-only and imports ajv's runtime and
// @data-fair/lib-validation, hence those dependencies of the shared workspace: import it, never require it.

const TOOLS_MESSAGE = 'tools must be an array of { name, description?, inputSchema? } with unique names matching [a-zA-Z0-9_-]{1,64}'

// Inline rather than $ref'd: an `errorMessage` does not reach the errors of a referenced schema.
const browserToolDescriptor = {
  title: 'Browser tool descriptor',
  description: 'A contextual tool the page offers. Only its advertisement — the page keeps the implementation.',
  type: 'object',
  additionalProperties: false,
  required: ['name'],
  properties: {
    // A model-facing tool identifier and a key of the correlation table: deliberately narrow, for
    // the same reason the MCP tool names are sanitised before they reach a prompt.
    name: { type: 'string', pattern: '^[a-zA-Z0-9_-]{1,64}$' },
    description: { type: 'string' },
    // JSON Schema, passed to the model as-is. Unvalidated here: the model's provider is the judge.
    inputSchema: {}
  }
}

const tools = {
  type: 'array',
  items: browserToolDescriptor,
  errorMessage: TOOLS_MESSAGE
}

const hostEventFrame = {
  title: 'Host event frame',
  description: 'One thing that happened on the page, as it travels. Structurally lib-vue\'s `AgentEvent`, pinned here because it is a wire type.',
  type: 'object',
  additionalProperties: false,
  required: ['name', 'at'],
  properties: {
    name: { type: 'string', minLength: 1 },
    detail: { type: 'string' },
    // Present on state-like events: a later event with the same key supersedes this one.
    key: { type: 'string' },
    at: { type: 'number' }
  }
}

export default {
  $id: 'https://github.com/data-fair/agents/agent-session-client-frame',
  'x-exports': ['types', 'validate'],
  // `discriminator`: only the branch named by `type` is evaluated, so its errors are the ones reported
  // and `removeAdditional` strips against that branch alone.
  'x-ajv': { discriminator: true, removeAdditional: true },
  title: 'Agent session client frame',
  type: 'object',
  discriminator: { propertyName: 'type' },
  errorMessage: {
    type: 'a message must be an object',
    // eslint-disable-next-line no-template-curly-in-string
    discriminator: 'unknown message type ${/type}'
  },
  oneOf: [
    {
      title: 'Hello frame',
      description: 'First message, and every switch of thread: declares the page\'s contextual tools, and binds the connection to an existing conversation or to none (the first prompt then creates one with `account` and `agentId`).',
      type: 'object',
      additionalProperties: false,
      required: ['type', 'tools'],
      errorMessage: { required: { tools: TOOLS_MESSAGE } },
      properties: {
        type: { const: 'hello' },
        conversationId: { type: 'string', errorMessage: 'conversationId must be a string when present' },
        agentId: { type: 'string', errorMessage: 'agentId must be a string when present' },
        account: {
          type: 'object',
          additionalProperties: false,
          required: ['type', 'id'],
          errorMessage: 'account must be { type: "user" | "organization", id } when present',
          properties: {
            type: { type: 'string', enum: ['user', 'organization'] },
            id: { type: 'string', minLength: 1 }
          }
        },
        // simple-directory's anonymous action token, required for an anonymous visitor's new thread:
        // a browser cannot set headers on a websocket upgrade.
        anonymousToken: { type: 'string', errorMessage: 'anonymousToken must be a string when present' },
        // The person's answer to the consent sheet, as the browser holds it. Strictly boolean: a
        // truthy string would make "no" read as consent.
        reviewConsent: { type: 'boolean', errorMessage: 'reviewConsent must be a boolean when present' },
        tools
      }
    },
    {
      title: 'Tools changed frame',
      description: 'The page navigated or its state changed: this is the tool set from now on.',
      type: 'object',
      additionalProperties: false,
      required: ['type', 'tools'],
      errorMessage: { required: { tools: TOOLS_MESSAGE } },
      properties: {
        type: { const: 'tools-changed' },
        // the same list as hello's, under the same type name
        tools: { ...tools, tsType: 'BrowserToolDescriptor[]' }
      }
    },
    {
      title: 'Prompt frame',
      description: 'A user turn. `hiddenContext` is wrapped by the server, never by the client (see `wrapHiddenContext`). `title` names the thread when this prompt creates it, and is ignored otherwise.',
      type: 'object',
      additionalProperties: false,
      required: ['type', 'content'],
      errorMessage: { required: { content: 'content must be a non-blank string' } },
      properties: {
        type: { const: 'prompt' },
        // Non-blank: a provider rejects a whitespace-only text block anyway.
        content: { type: 'string', pattern: '\\S', errorMessage: 'content must be a non-blank string' },
        hiddenContext: { type: 'string', errorMessage: 'hiddenContext must be a string when present' },
        title: { type: 'string', errorMessage: 'title must be a string when present' }
      }
    },
    {
      title: 'Tool result frame',
      description: 'The answer to a `tool-call`: exactly one of result or error.',
      type: 'object',
      additionalProperties: false,
      required: ['type', 'callId'],
      errorMessage: { required: { callId: 'callId must be a non-empty string' } },
      properties: {
        type: { const: 'tool-result' },
        callId: { type: 'string', minLength: 1, errorMessage: 'callId must be a non-empty string' },
        result: {},
        error: { type: 'string', errorMessage: 'error must be a string' }
      },
      // Exactly one: both would leave "did it work?" to a tie-break.
      allOf: [{
        oneOf: [{ required: ['result'] }, { required: ['error'] }],
        errorMessage: 'a tool-result carries exactly one of result or error'
      }],
      // the XOR above is not something json-schema-to-typescript can express
      tsType: '{ type: "tool-result", callId: string, result?: unknown, error?: string }'
    },
    {
      title: 'Abort frame',
      description: 'Stop the turn in flight. `dismissWait` also settles a pending handover as stopped: only the chat\'s Stop says so.',
      type: 'object',
      additionalProperties: false,
      required: ['type'],
      properties: {
        type: { const: 'abort' },
        dismissWait: { type: 'boolean', errorMessage: 'dismissWait must be a boolean when present' }
      }
    },
    {
      title: 'Trace consent frame',
      description: 'The person\'s answer to the consent sheet, when they give or change it.',
      type: 'object',
      additionalProperties: false,
      required: ['type', 'consented'],
      errorMessage: { required: { consented: 'consented must be a boolean' } },
      properties: {
        type: { const: 'review-consent' },
        consented: { type: 'boolean', errorMessage: 'consented must be a boolean' }
      }
    },
    {
      title: 'Host state frame',
      description: 'What is true on the page right now: retained, keyed facts, replacing the previous state wholesale. A null value withdraws a fact.',
      type: 'object',
      additionalProperties: false,
      required: ['type', 'state'],
      errorMessage: { required: { state: 'state must be an object of keyed facts' } },
      properties: {
        type: { const: 'host-state' },
        state: { type: 'object', errorMessage: 'state must be an object of keyed facts' }
      }
    },
    {
      title: 'Host events frame',
      description: 'Things the person did. Appended, coalesced and capped by the store, not by the wire.',
      type: 'object',
      additionalProperties: false,
      required: ['type', 'events'],
      errorMessage: { required: { events: 'events must be an array' } },
      properties: {
        type: { const: 'host-events' },
        events: {
          type: 'array',
          items: hostEventFrame,
          // These reach the model's context as prose, and `at` orders the coalescing.
          errorMessage: { type: 'events must be an array', _: 'each event needs a non-empty name and a numeric at, and detail and key must be strings when present' }
        }
      }
    },
    {
      title: 'Approval frame',
      description: 'The person\'s decision on a call the approval gate stopped, for the conversation this socket is bound to.',
      type: 'object',
      additionalProperties: false,
      required: ['type', 'approvalId', 'approved'],
      errorMessage: {
        required: {
          approvalId: 'approvalId must be a non-empty string',
          approved: 'approved must be a boolean'
        }
      },
      properties: {
        type: { const: 'approval' },
        approvalId: { type: 'string', minLength: 1, errorMessage: 'approvalId must be a non-empty string' },
        // Strictly boolean: a truthy string must not read as an approval.
        approved: { type: 'boolean', errorMessage: 'approved must be a boolean' },
        reason: { type: 'string', maxLength: 1000, errorMessage: 'reason must be a string of at most 1000 characters' }
      }
    }
  ]
}
