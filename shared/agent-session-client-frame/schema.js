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

import { CLIENT_FRAME_LIMITS as L, TOOLS_MESSAGE, SKILLS_MESSAGE } from './limits.js'

/** @param {string} name */
const ID_MESSAGE = (name) => `${name} must be a string of at most ${L.id} characters when present`

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
    description: { type: 'string', maxLength: L.toolDescription },
    // JSON Schema, passed to the model as-is. Unvalidated here: the model's provider is the judge.
    inputSchema: {}
  }
}

const tools = {
  type: 'array',
  maxItems: L.tools,
  items: browserToolDescriptor,
  errorMessage: TOOLS_MESSAGE
}

const pageSkillDescriptor = {
  title: 'Page skill descriptor',
  description: 'A skill the page publishes beside its tools: an MCP `skill://…/SKILL.md` resource, body included, listed to the model like an MCP server\'s skills.',
  type: 'object',
  additionalProperties: false,
  required: ['name', 'description', 'uri', 'body'],
  properties: {
    // The Agent Skills name format, as MCP skills have it.
    name: { type: 'string', pattern: '^[a-z0-9]+(-[a-z0-9]+)*$', maxLength: 64 },
    description: { type: 'string', maxLength: L.skillDescription },
    uri: { type: 'string', pattern: '^skill://', maxLength: L.id },
    body: { type: 'string', maxLength: L.skillBody }
  }
}

const skills = {
  type: 'array',
  maxItems: L.skills,
  items: pageSkillDescriptor,
  errorMessage: SKILLS_MESSAGE
}

const hostEventFrame = {
  title: 'Host event frame',
  description: 'One thing that happened on the page, as it travels. Structurally lib-vue\'s `AgentEvent`, pinned here because it is a wire type.',
  type: 'object',
  additionalProperties: false,
  required: ['name', 'at'],
  properties: {
    name: { type: 'string', minLength: 1, maxLength: L.eventName },
    detail: { type: 'string', maxLength: L.eventDetail },
    // Present on state-like events: a later event with the same key supersedes this one.
    key: { type: 'string', maxLength: L.eventName },
    at: { type: 'number' }
  }
}

export default {
  $id: 'https://github.com/data-fair/agents/agent-session-client-frame',
  'x-exports': ['types', 'validate'],
  // `discriminator`: only the branch named by `type` is evaluated, so its errors are the ones reported
  // and `removeAdditional` strips against that branch alone.
  'x-ajv': { discriminator: true, removeAdditional: true },
  // Arrays as arrays: bounded lists (maxItems ≤ 20) would otherwise be typed as tuples of every length.
  'x-jstt': { ignoreMinAndMaxItems: true },
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
        conversationId: { type: 'string', maxLength: L.id, errorMessage: ID_MESSAGE('conversationId') },
        agentId: { type: 'string', maxLength: L.id, errorMessage: ID_MESSAGE('agentId') },
        account: {
          type: 'object',
          additionalProperties: false,
          required: ['type', 'id'],
          errorMessage: 'account must be { type: "user" | "organization", id } when present',
          properties: {
            type: { type: 'string', enum: ['user', 'organization'] },
            id: { type: 'string', minLength: 1, maxLength: L.id }
          }
        },
        // simple-directory's anonymous action token, required for an anonymous visitor's new thread:
        // a browser cannot set headers on a websocket upgrade.
        anonymousToken: { type: 'string', maxLength: L.token, errorMessage: `anonymousToken must be a string of at most ${L.token} characters when present` },
        // The person's answer to the consent sheet, as the browser holds it. Strictly boolean: a
        // truthy string would make "no" read as consent.
        reviewConsent: { type: 'boolean', errorMessage: 'reviewConsent must be a boolean when present' },
        tools,
        // Absent means the page publishes none.
        skills
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
        tools: { ...tools, tsType: 'BrowserToolDescriptor[]' },
        skills: { ...skills, tsType: 'PageSkillDescriptor[]' }
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
        content: { type: 'string', pattern: '\\S', maxLength: L.prompt, errorMessage: `content must be a non-blank string of at most ${L.prompt} characters` },
        hiddenContext: { type: 'string', maxLength: L.hiddenContext, errorMessage: `hiddenContext must be a string of at most ${L.hiddenContext} characters when present` },
        title: { type: 'string', maxLength: L.title, errorMessage: `title must be a string of at most ${L.title} characters when present` }
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
        callId: { type: 'string', minLength: 1, maxLength: L.id, errorMessage: 'callId must be a non-empty string' },
        // Bounded by the socket's payload cap (service.ts), like any frame.
        result: {},
        error: { type: 'string', maxLength: L.toolError, errorMessage: `error must be a string of at most ${L.toolError} characters` }
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
        state: {
          type: 'object',
          maxProperties: L.stateKeys,
          propertyNames: { maxLength: L.eventName },
          additionalProperties: { type: ['string', 'null'], maxLength: L.stateValue },
          errorMessage: `state must be an object of at most ${L.stateKeys} keyed facts, each a string of at most ${L.stateValue} characters or null`
        }
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
          maxItems: L.events,
          items: hostEventFrame,
          // These reach the model's context as prose, and `at` orders the coalescing.
          errorMessage: { type: 'events must be an array', _: `at most ${L.events} events, each with a non-empty name and a numeric at; detail (at most ${L.eventDetail} characters) and key must be strings when present` }
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
        approvalId: { type: 'string', minLength: 1, maxLength: L.id, errorMessage: 'approvalId must be a non-empty string' },
        // Strictly boolean: a truthy string must not read as an approval.
        approved: { type: 'boolean', errorMessage: 'approved must be a boolean' },
        reason: { type: 'string', maxLength: 1000, errorMessage: 'reason must be a string of at most 1000 characters' }
      }
    }
  ]
}
