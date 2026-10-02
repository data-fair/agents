/**
 * operations.ts contains pure stateless functions
 * should not reference #mongo, #config, store state in memory or import anything else than other operations.ts
 *
 * The conversation export: one stored conversation turned into a file a coding agent can analyse.
 *
 * WHY JSONL, and why one file rather than an archive. An export is routinely megabytes — a single
 * tool result is capped at TOOL_RESULT_LIMIT (100k chars) and a turn can hold several — so the
 * format's only real job is to let a reader fetch the part it wants without loading the rest. What
 * makes a big text file navigable is LINE ADDRESSING, and prose-shaped content destroys it: markdown,
 * code and pretty-printed JSON are all multi-line, so "the answer starts at line 340" stops meaning
 * anything. JSONL restores it, because a newline inside a string is escaped: a 100k-char tool result
 * is exactly ONE line, read deliberately with `sed -n '47p'` or sampled with `head -c`. That is also
 * why the header can carry pointers at all — a pointer is a line number, and line numbers are stable
 * because records are lines.
 *
 * Three things follow from that, and they are the whole design:
 *
 *  1. Line 1 is `meta` and line 2 is `outline`. Reading two lines tells a reader what the file holds
 *     and which line every record is on, with a size and a preview for each. Nothing else needs to be
 *     read to decide what to read.
 *  2. A part bigger than EXTRACT_THRESHOLD is LIFTED OUT of its message into its own `blob` record,
 *     leaving a stub that keeps the identifying fields plus a `__ref`. So the transcript stays small
 *     enough to read whole (`sed -n '3,60p'`), and each large tool result is one addressable line —
 *     the archive-with-a-file-per-result idea, without the archive.
 *  3. Identical system prompts are stored once and referenced, because every run of a conversation
 *     normally has the same one and repeating it N times is most of the file for a long thread.
 *
 * The alternative considered was a zip with an index, a file per model call and tool results as
 * separate files. It loses on two counts: there are no stored per-call HTTP bodies to make files out
 * of any more (the trace collection is gone — what exists is the conversation, the runs' per-call
 * telemetry and the system prompt), and it needs either a dependency or a hand-written zip writer to
 * produce something an agent must unpack before it can grep. JSONL is greppable in place.
 */

/**
 * Above this many characters, a part is lifted into its own record.
 *
 * Deliberately well below a tool result's cap and above a normal turn of text: the point is that the
 * readable transcript stays readable, not that every part be small.
 */
export const EXTRACT_THRESHOLD = 2000

/** Characters of each record shown in the outline, enough to recognize it without opening it. */
const PREVIEW_LENGTH = 160

export interface ExportInput {
  conversation: Record<string, any>
  messages: Array<Record<string, any>>
  runs: Array<Record<string, any>>
}

export interface OutlineEntry {
  /** 1-based line number in the file, which is what a reader passes to `sed -n`. */
  line: number
  record: 'message' | 'blob' | 'run'
  /** Message sequence number, for a message record and for the blobs lifted out of it. */
  seq?: number
  /** The `__ref` a message stub points at, for a blob record. */
  ref?: string
  role?: string
  bytes: number
  preview: string
}

/** One line of flattened text, for recognizing a record in the outline. */
const previewOf = (value: unknown): string => {
  const text = typeof value === 'string' ? value : JSON.stringify(value) ?? ''
  const flat = text.replace(/\s+/g, ' ').trim()
  return flat.length > PREVIEW_LENGTH ? flat.slice(0, PREVIEW_LENGTH) + '…' : flat
}

/** The most human-readable field of a part, whatever kind of part it is. */
const partText = (part: any): unknown =>
  part?.text ?? part?.output?.text ?? part?.output ?? part?.input ?? part

/**
 * What stays in the message in place of a lifted part: enough to read the transcript — which tool,
 * which call, what state, what it roughly said — plus where the full value is.
 */
const stubPart = (part: any, ref: string, bytes: number) => {
  const stub: Record<string, unknown> = {}
  for (const field of ['type', 'toolName', 'toolCallId', 'state', 'errorText']) {
    if (part?.[field] !== undefined) stub[field] = part[field]
  }
  stub.__ref = ref
  stub.__bytes = bytes
  stub.__preview = previewOf(partText(part))
  return stub
}

const stringify = (value: unknown): string => JSON.stringify(value) ?? 'null'

/** How to read the file, carried IN the file: it has to be usable by an agent that has no skill. */
const GUIDE = [
  'JSON Lines: one JSON record per line, so a line number is a stable address and a multi-line value',
  'is still one line. Line 1 is this meta record, line 2 is the outline (every record with its line,',
  'size and preview). Read those two first, then read only what you need:',
  '`sed -n \'3,60p\' <file>` for the transcript, `sed -n \'<line>p\' <file>` for one large value,',
  '`head -c 2000 <(sed -n \'<line>p\' <file>)` to sample one that is too big to want whole.',
  'A part larger than its threshold was lifted into its own `blob` record; the message keeps a stub',
  'with `__ref`, `__bytes` and `__preview`, and the blob with that `ref` holds the full value.',
  '`run` records carry the per-call telemetry (model, tokens, credits, duration, how much history each',
  'call actually sent) and a reference to the system prompt the model was given.'
].join(' ')

/**
 * The export, as the complete file contents.
 *
 * Built whole rather than streamed: the caller has already read the conversation into memory to
 * authorize it, and every line's number has to be known before line 2 can be written.
 */
export function buildConversationExport (input: ExportInput, exportedAt = new Date()): string {
  const { conversation, messages, runs } = input

  // Records in reading order, each with the outline entry describing it — minus its line number,
  // which is only known once every record exists.
  const records: Array<{ json: string, outline: Omit<OutlineEntry, 'line'> }> = []

  for (const message of messages) {
    const lifted: Array<{ ref: string, json: string, bytes: number, preview: string }> = []
    const parts = (Array.isArray(message.parts) ? message.parts : []).map((part: any, index: number) => {
      const json = stringify(part)
      if (json.length <= EXTRACT_THRESHOLD) return part
      const ref = `part:${message.seq}:${index}`
      lifted.push({ ref, json, bytes: json.length, preview: previewOf(partText(part)) })
      return stubPart(part, ref, json.length)
    })

    const record = { type: 'message', ...message, parts }
    const json = stringify(record)
    records.push({
      json,
      outline: {
        record: 'message',
        seq: message.seq,
        role: message.role,
        bytes: json.length,
        preview: previewOf(parts.map((part: any) => previewOf(partText(part))).join(' | '))
      }
    })

    // Right after the message they came out of, so a reader following the transcript finds them
    // where they belong rather than in a separate section.
    for (const blob of lifted) {
      const blobJson = stringify({ type: 'blob', ref: blob.ref, conversationSeq: message.seq, value: JSON.parse(blob.json) })
      records.push({
        json: blobJson,
        outline: { record: 'blob', seq: message.seq, ref: blob.ref, bytes: blobJson.length, preview: blob.preview }
      })
    }
  }

  // System prompts, deduped by content: every run of a conversation normally gets the same prompt,
  // and for a long thread repeating it would be most of the file.
  const promptRefs = new Map<string, string>()
  const promptRecords: Array<{ json: string, outline: Omit<OutlineEntry, 'line'> }> = []
  const promptRef = (prompt: string): string => {
    const existing = promptRefs.get(prompt)
    if (existing) return existing
    const ref = `prompt:${promptRefs.size + 1}`
    promptRefs.set(prompt, ref)
    const json = stringify({ type: 'blob', ref, value: prompt })
    promptRecords.push({ json, outline: { record: 'blob', ref, bytes: json.length, preview: previewOf(prompt) } })
    return ref
  }

  const runRecords = runs.map(run => {
    const { systemPrompt, ...rest } = run
    const record = { type: 'run', ...rest, ...(systemPrompt ? { systemPromptRef: promptRef(systemPrompt) } : {}) }
    const json = stringify(record)
    return {
      json,
      outline: {
        record: 'run' as const,
        bytes: json.length,
        preview: previewOf(`${run.status ?? ''} ${run.stopReason ?? ''} ${(run.calls ?? []).length} calls ${run.credits ?? 0} credits`)
      }
    }
  })

  // Prompts before the runs that reference them, so a reader going top to bottom has the
  // instructions in hand before the calls made under them.
  records.push(...promptRecords, ...runRecords)

  const HEADER_LINES = 2
  const outline: OutlineEntry[] = records.map((record, index) => ({ line: HEADER_LINES + 1 + index, ...record.outline }))

  const meta = {
    type: 'meta',
    exportVersion: 1,
    exportedAt: exportedAt.toISOString(),
    guide: GUIDE,
    extractThreshold: EXTRACT_THRESHOLD,
    conversation,
    counts: {
      messages: messages.length,
      runs: runs.length,
      blobs: outline.filter(entry => entry.record === 'blob').length
    },
    lines: { meta: 1, outline: 2, firstRecord: HEADER_LINES + 1, total: HEADER_LINES + records.length }
  }

  return [stringify(meta), stringify({ type: 'outline', records: outline }), ...records.map(record => record.json)]
    .join('\n') + '\n'
}

/** A name that says what the file is and which thread it came from, for a downloads folder. */
export const exportFilename = (conversationId: string): string => `conversation-${conversationId}.jsonl`
