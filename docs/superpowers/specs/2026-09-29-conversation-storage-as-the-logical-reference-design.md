# Conversation storage as the logical reference

**Status:** implemented
**Date:** 2026-09-29
**Supersedes:** the storage half of the autonomous agents P0 runtime spine

## The problem, stated exactly

An autonomous agent's conversation is **stored, revivable, and incomplete**. That combination is not
acceptable: a conversation is either ephemeral and complete, or stored and complete. Reviving an
incomplete one is wrong.

It is not an edge case. `runModelLoop` calls `loadHistory` unconditionally, so there is no in-memory
continuation — for an autonomous agent the store IS the conversation, and every turn after the first
is a revival.

What is stored per assistant turn: `content`, `reasoning`, and `toolCalls` as name + bounded
arguments. What is not stored: the tool **results**. `loadHistory` then keeps only messages with
non-empty `content` and flattens them to `{role, content}`.

A real fixture turn, stored versus replayed:

```
STORED     assistant "done"   toolCalls: [{ echo, {"value":"Dev Organization"} }]
REPLAYED   {"role":"assistant","content":"done"}
```

The next turn sees neither the result nor the fact that a tool was called. A message with no text at
all is dropped entirely, so a turn that only called tools leaves no trace in history whatsoever.

Consequences: data must be re-fetched to be referenced (only a cost for a read-only tool, not
recoverable for a point-in-time reading), and the model cannot see that it already acted — nothing
here stops it repeating a write it has no memory of.

### Two findings that narrow the fix

**Compaction is already non-destructive.** `compactHistory` returns `[recapMessage(summary),
...retained]` and writes nothing; it is recomputed from `loadHistory` every turn. So the store already
holds everything it persists, and compaction is already a derived view. Storing a post-compaction
"last full context" would CREATE the pre-compaction loss rather than inherit it — and on a shared
timeline that loss means instructors stop being able to see what they themselves wrote.

**The full-context format already exists, in traces.** `buildTraceRequestDoc` stores `request.body`,
the complete messages array as sent, tool results included. That is the duplicate modelization: it is
stored per request, and since every request resends the whole history, a conversation's traces cost
O(n²) in message count. Correct for 30-day observability; wrong as the conversation of record.

So the gap is **one missing field**, not a missing architecture.

## Principle

A stored conversation is complete by construction, not by care. The stored form must be sufficient to
reconstruct exactly what the model saw, without inference and without a second source.

## Decisions taken

1. **Tool results are bounded** at a value large enough to be rarely reached, with the truncation
   recorded explicitly so the model is told it is seeing a trimmed result.
2. **Conversations are stored indefinitely.** No TTL for now.
3. **Conversation storage and trace storage are separate concerns.** An autonomous agent's log is its
   own working memory, not a user chat recorded for review, so it is outside the `storeTraces` opt-in
   and its consent gate. Traces remain opt-in, consent-gated and TTL'd, for observability.

## The model

Each stored message carries **model-message content parts** rather than flattened text plus
name-and-args:

- `text`
- `reasoning`
- `tool-call` — `toolCallId`, `toolName`, `serverId`, `arguments`
- `tool-result` — `toolCallId`, `toolName`, the result, and `truncated` when bounded

`loadHistory` becomes a straight mapping from stored parts to `ModelMessage[]`, with no filtering on
empty content and no flattening. Revival is then complete by construction: the pairs are in the store,
so they can be replayed as pairs, and the provider-rejects-partial-pairs problem disappears because
pairs are never partial.

Retained deliberately:

- **Append-only.** A single replaced blob would force a full refetch on every throttled partial-text
  persist, and would break the version cursor that makes incremental fetch work. The log keeps
  `seq`/version, so `?sinceVersion=` is unaffected.
- **Attribution in content.** The `[from name (id)]` prefix stays where it is — it is a safety
  property of the shared timeline and it already survives any format change.
- **Compaction unchanged.** Derived, per-turn, non-destructive. No pre-compaction loss.

### The bound

`TOOL_RESULT_LIMIT = 100_000` characters, reusing the existing truncation convention from
`summarizeToolArguments`: `… [truncated, N chars total]`.

Rationale: `CHARS_PER_TOKEN` is 4 and the default context window is 128 000 tokens, so 100 000 chars
is ~25 000 tokens — about a fifth of a default context. Large enough that a typical MCP result (a JSON
page of rows, single-digit KB) never approaches it, small enough that one result cannot exhaust the
context on its own, and far below MongoDB's 16 MB document cap even with several results on one
message. One constant in one place, so the value is easy to revisit.

The marker is not cosmetic: it lands in the text the model sees on revival, which is what makes a
trimmed result honest rather than silently short.

### Traces, after the separation

Traces stop carrying a copy of the conversation. They keep what only they know — model, provider,
usage, timing, cost, moderation, flags — plus a reference to the conversation and the seq range the
request covered. The conversation log is the single place the messages live.

This is the collapse from three shapes to two, with distinct jobs: **the conversation log** (complete,
append-only, indefinite) and **the trace** (per-request metadata, opt-in, TTL'd, pointing at it).

## Scope

- `api/types/conversation-message/schema.js` — content parts
- `api/src/conversations/executor.ts` — persist parts; bound results at the point they are
  produced (the same place `withProvenance` wraps them, since within a turn the SDK feeds results back
  without passing through `loadHistory`)
- `api/src/conversations/executor.ts` — `loadHistory` as a straight mapping
- `shared/autonomous-agent-chat-message.ts` — map parts onto the chat transcript type
- UI tool-chip rendering
- `api/src/traces/operations.ts` — drop the duplicated body for autonomous-agent traces

### No migration

This branch has never been deployed and this worktree is the only place the data exists, so there is
nothing to migrate and no upgrade script. The new shape replaces the old outright: existing
autonomous-agent messages are dropped, and dev fixtures are re-seeded by `npm run dev-fixtures`. The
test suite already wipes its own (`clean()`).

This is worth being explicit about, because it is the reason the change can be clean: there is no
backward-compatible read path to keep, and no partially-populated documents to reason about. Nothing
in the code should accept a message without content parts.

## Testing

- A stored turn with a tool call round-trips through `loadHistory` into a valid tool-call/tool-result
  pair — the property the whole change exists for, asserted directly rather than inferred.
- A result over the bound is stored truncated, carries the marker, and the marker reaches the model.
- A message with tool parts and no text survives history (the case that is silently dropped today).
- A revived conversation reproduces the exact message array the model saw before, for a conversation
  built across several turns.
- Traces no longer duplicate the messages, and still carry usage/cost/timing.

## Out of scope

- The in-page chat, which is ephemeral and complete today and needs no storage. It may share the
  format via `shared/` without persisting it.
- Caching the compaction recap to avoid re-summarising each turn. A real optimisation, unchanged in
  behaviour by this work, and separable.
- P1's approval gate, which is what actually closes the repeat-a-write risk. This change gives it the
  record it needs; it does not substitute for it.
