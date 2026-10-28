// The sizes of what a browser may send on the agent session socket, in characters or items.
//
// Stated so a browser-facing surface has bounds: without them a single frame could carry a prompt as
// large as the socket's payload cap, or thousands of tool declarations, all of it folded into a model
// call. Generous for a person — a long paste fits in `prompt` — and tied to what the chat itself sends
// (lib-vue's EVENT_DETAIL_MAX_CHARS for `eventDetail`). Separate from schema.js so the protocol module
// and the tests can read them.
export const CLIENT_FRAME_LIMITS = {
  prompt: 200_000,
  hiddenContext: 20_000,
  title: 200,
  tools: 100,
  toolDescription: 10_000,
  toolError: 10_000,
  events: 100,
  eventName: 200,
  eventDetail: 1000,
  stateKeys: 100,
  stateValue: 10_000,
  id: 200,
  token: 4096,
  // A page's skills travel in the same frame as its tools, bodies included, so their bounds keep the
  // whole frame under the socket's 1 MiB payload cap (api/src/agent-session/service.ts): a frame over
  // it would lose the page's tools along with its skills. lib-vue trims to these before sending
  // (fitPageSkills), so a page with oversized skills still gets its tools across.
  skills: 20,
  skillDescription: 1024,
  skillBody: 30_000
}

const L = CLIENT_FRAME_LIMITS

/** What a client is told about a malformed tool list: the schema's message, and the uniqueness check's. */
/** What a client is told about a malformed skill list. */
export const SKILLS_MESSAGE = `skills must be an array of at most ${L.skills} { name, description, uri, body } with unique skill:// URIs, names in lowercase-hyphen form, descriptions of at most ${L.skillDescription} characters and bodies of at most ${L.skillBody}`

export const TOOLS_MESSAGE = `tools must be an array of at most ${L.tools} { name, description?, inputSchema? } with unique names matching [a-zA-Z0-9_-]{1,64}, and descriptions of at most ${L.toolDescription} characters`
