---
name: conversation-export
description: Analyse a conversation exported from the admin review page (a conversation-<id>.jsonl file). Use when asked why an agent answered the way it did, whether a tool failed, where the context went, or what a turn cost, from a downloaded export.
---

# Analysing an exported conversation

A superadmin downloaded one conversation from the review page
(`Download` → `conversation-<id>.jsonl`). This is how to read it without burning
context on the parts of it nobody asked about.

This file is the whole record: what the person said, what the agent answered,
every tool call with its arguments and results, the instructions the model was
given, and per-call telemetry (model, tokens, credits, duration, how much history
each call actually sent). There is nothing else to fetch — no server to query, no
second file.

## The format, in one paragraph

JSON Lines: one JSON record per line. A line number is therefore a stable address,
and a multi-line value (markdown, code, JSON) is still **one** line because its
newlines are escaped. **Line 1** is `meta`, **line 2** is `outline`. Every other
line is a `message`, a `blob` or a `run`. A part larger than `extractThreshold`
(stated in `meta`) was lifted out of its message into its own `blob` record; the
message keeps a stub with `__ref`, `__bytes` and `__preview`, and the blob with
that `ref` holds the value verbatim.

## Read it in this order

**Never `cat` the file and never Read it whole.** A single tool result can be
100k characters, and a long thread has many.

1. **Lines 1-2 — the map.**

   ```bash
   sed -n '1p' conversation-<id>.jsonl | jq '{counts, lines, conversation: .conversation.title}'
   sed -n '2p' conversation-<id>.jsonl | jq -r '.records[] | "\(.line)\t\(.record)\t\(.seq // .ref // "")\t\(.bytes)\t\(.preview)"'
   ```

   The second command is the index: one line per record with its line number,
   size and preview. After it you know where everything is and how big it is.

2. **The transcript.** Message records are small (big parts were lifted out), so
   read them as a block — `meta.lines.firstRecord` is where records start:

   ```bash
   sed -n '3,80p' conversation-<id>.jsonl | jq -c 'select(.type=="message") | {seq, role, parts: [.parts[] | {type, toolName, state, text, __preview, __ref}]}'
   ```

3. **Only the blobs the question needs.** One line, read deliberately:

   ```bash
   # a whole lifted part; the fallbacks cover a tool whose output is a bare string
   sed -n '47p' conversation-<id>.jsonl | jq -r '.value.output.text // .value.output // .value.text // .value'
   sed -n '47p' conversation-<id>.jsonl | jq -r '.value.output.text // .value.output' | head -c 3000   # a sample
   ```

   Decide from the outline's `bytes` whether you want the whole thing. A 100k
   result rarely needs reading end to end — its first lines and a grep usually
   answer the question.

4. **The runs, for cost and context behaviour.**

   ```bash
   grep '"type":"run"' conversation-<id>.jsonl | jq -c '{status, stopReason, steps, credits, calls: [.calls[] | {modelRole, model, inputTokens, outputTokens, credits, durationMs, finishReason, messageCount, historyUpToSeq}]}'
   ```

5. **The system prompt**, once, by its ref:

   ```bash
   grep '"ref":"prompt:1"' conversation-<id>.jsonl | jq -r '.value'
   ```

Searching the whole file is cheap and safe — `grep -n` prints line numbers you
can then read selectively:

```bash
grep -n 'list_road_closures' conversation-<id>.jsonl | cut -c1-200
```

## What the records contain

| Record | Key fields |
|---|---|
| `meta` | `exportVersion`, `exportedAt`, `guide`, `extractThreshold`, `conversation` (the stored document: id, `agentId`, owner, `userId`, title, dates, `consentedToReview`, `archivedAt`), `counts`, `lines` |
| `outline` | `records[]`: `line`, `record`, `seq`/`ref`, `role`, `bytes`, `preview` |
| `message` | `seq` (order), `role` (`user`/`assistant`), `author`, `createdAt`, `parts[]` |
| `blob` | `ref`, `conversationSeq` (absent for a prompt), `value` — the lifted part, or the system prompt |
| `run` | one per turn: `status`, `stopReason`, `steps`, `credits`, `calls[]`, `systemPromptRef`, `triggeredBy`, `triggeredByRole`, timestamps |

A message's `parts` are the AI SDK's `UIMessagePart` list, **in order**, and the
order is the turn: `text`, then `dynamic-tool` parts whose `state` is
`output-available` / `output-error` / `output-denied`, then more text. A failed
tool call is a part with `state: 'output-error'` and an `errorText` — not a
missing part, and not a successful-looking one.

## Answering the usual questions

- **"Why did it answer that?"** Read the system prompt, then the transcript in
  order. The answer is almost always either an instruction it followed literally
  or a tool result it was handed.
- **"Did a tool fail?"** `grep -n 'output-error' <file>`, then read that part's
  blob. Also check for a call with no result at all: a `dynamic-tool` part stuck
  in `input-available` means the turn ended before the tool returned.
- **"Where did the context go?"** Compare each call's `messageCount` and
  `historyUpToSeq` against the number of stored messages. A `messageCount` well
  below it means compaction replaced a prefix with a recap; `inputTokens` far
  below the stored size means old tool results were cleared. Both are normal —
  see `docs/architecture/context-management.md`.
- **"What did it cost, and on what?"** Sum `credits` across runs, and read
  `calls[].modelRole` to see which seat spent it (an `assistant` turn, the
  `summarizer` compacting, the `moderator` gate).
- **"Did it stop early?"** `run.stopReason`: `step-limit`, `repeated-calls`,
  `budget`, `timeout`, `aborted`. Each has a guard behind it in
  `docs/architecture/loop-guards.md`.

## Report findings, not transcript

Quote the smallest thing that proves the point — a line number plus the sentence
that matters — rather than pasting records. The person has the file; they want to
know what is wrong with it.
