export default {
  $id: 'https://github.com/data-fair/agents/autonomous-agent-conversation',
  'x-exports': ['types'],
  title: 'Autonomous agent conversation',
  type: 'object',
  additionalProperties: false,
  required: ['id', 'autonomousAgentId', 'owner', 'title', 'createdAt', 'messageSeq'],
  properties: {
    id: { type: 'string' },
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
    title: { type: 'string' },
    createdAt: { type: 'string', format: 'date-time' },
    // Declared because the service WRITES it — bumpConversationVersion and appendMessage both $set it.
    // With additionalProperties: false and no declaration, every stored conversation violated its own
    // schema and the generated type lacked a field the collection always has. The other three
    // autonomous-agent schemas all declare theirs.
    updatedAt: { type: 'string', format: 'date-time' },
    lastMessageAt: { type: 'string', format: 'date-time' },
    // monotonic, starts at 1 — see nextMessageSeq
    messageSeq: { type: 'number', minimum: 0 },
    // Monotonic across EVERY change to the conversation: a message appended, a message updated
    // in place (the assistant's content as it grows), a run transition. It is what the websocket
    // notification carries and what `GET .../messages?sinceVersion=` fetches from, so a client
    // needs nothing but this number to catch up.
    //
    // A counter rather than a timestamp on purpose: two writes in the same millisecond make a
    // timestamp-based cursor either skip one or re-deliver it, while an $inc cannot collide.
    version: { type: 'number', minimum: 0 },
    /**
     * The compaction recap: a CACHE, not part of the conversation.
     *
     * The stored messages remain the conversation of record — complete, and never rewritten by a
     * compaction. This only spares the summarizer from re-reading the same prefix on every turn.
     *
     * Without it, compaction re-summarised from scratch on EVERY turn once a conversation crossed the
     * budget, permanently: nothing was persisted, so the next turn loaded the whole history again and
     * was over budget again. That grew more expensive as the conversation grew, and storing tool
     * results made conversations cross the threshold far sooner — a single 100k-char result is about a
     * quarter of a default budget on its own.
     *
     * `coversUpToSeq` is a STORED MESSAGE boundary, never mid-turn, so the model context can be
     * rebuilt as [recap, ...messages after it] and reproduce exactly what the previous turn saw.
     */
    compaction: {
      type: 'object',
      additionalProperties: false,
      required: ['summary', 'generation', 'coversUpToSeq'],
      properties: {
        summary: { type: 'string' },
        // How many times this conversation has been compacted. Drives the summarizer prompt: from the
        // second on it is told a recap already heads the content and asked to merge rather than
        // re-digest, which is what keeps chained generations from compounding loss.
        generation: { type: 'number', minimum: 1 },
        coversUpToSeq: { type: 'number', minimum: 1 },
        createdAt: { type: 'string', format: 'date-time' }
      }
    }
  }
}
