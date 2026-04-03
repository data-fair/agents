# Subagent System Architecture Review

## Context

The subagent system in `use-agent-chat.ts` implements an **orchestrator-worker** pattern where the main agent delegates tasks to specialized subagents via tool calls. This review evaluates: (1) can it support multi-turn parent-subagent exchanges? (2) is it on par with state-of-the-art?

## Assessment

### Current Pattern: Single-Trip Tool Delegation

The flow is: main agent calls `subagent_X({task})` → nested `streamText()` runs autonomously → returns final text. Key characteristics:

- **No multi-turn exchange**: `executeSubAgent()` (line 291 of `use-agent-chat.ts`) runs one `streamText` call and returns. Subagent cannot ask the parent for clarification, and the parent cannot refine based on intermediate results.
- **No parent context**: Subagent receives only the task string — no conversation history, no prior tool results.
- **Text-only return**: Main agent gets plain text back; no structured output or context control.
- **Client-side orchestration**: All orchestration happens in the browser; the API gateway is a stateless LLM proxy.
- **Fragile config resolution**: `resolveSubAgents` calls `execute({task: ''})` to fetch config, overloading execute for two purposes.

### Comparison with State-of-the-Art

| Capability | This System | AI SDK v6 (own dep) | OpenAI Agents SDK | LangGraph | CrewAI |
|---|---|---|---|---|---|
| Multi-turn parent↔subagent | No | Yes (async generators) | Yes (handoffs) | Yes (graph cycles) | Yes (delegation) |
| Parent context forwarding | No | Yes (`messages` in execute) | Yes (full history) | Yes (shared state) | Yes |
| Structured output control | No | Yes (`toModelOutput`) | Yes | Yes | Yes |
| Parallel subagent execution | No | Yes | Yes | Yes | Yes |
| Persistence | No | Optional | Built-in | Checkpointing | Optional |
| Server-side orchestration | No | Either | Server | Server | Server |

**Verdict**: The system is a reasonable v1 but is behind on every dimension. Notably, it doesn't use `ToolLoopAgent` or `toModelOutput` from its own `ai@^6` dependency.

## Recommended Improvements (Prioritized)

### P0: Multi-Turn Parent-Subagent Exchange

**Approach**: Convert subagent tool execute from a single async function to an **async generator** that yields intermediate `UIMessage` objects. This is the pattern documented in `ai/docs/03-agents/06-subagents.mdx`.

**Files to modify**:
- `ui/src/composables/use-agent-chat.ts` — `executeSubAgent()` becomes a generator; tool construction in `sendMessage` (lines 458-507) uses `readUIMessageStream`
- `ui/src/components/agent-chat/AgentChatMessages.vue` — render preliminary/intermediate subagent results

### P1: Adopt ToolLoopAgent

Replace manual `streamText` + step counting with the AI SDK's `ToolLoopAgent` class.

**Files to modify**:
- `ui/src/composables/use-agent-chat.ts` — replace `executeSubAgent` (lines 291-378) with `ToolLoopAgent` instances

### P2: Forward Parent Context

Pass conversation history (or its summary) to subagents instead of just the task string.

**File**: `ui/src/composables/use-agent-chat.ts` line 321 — change `messages: [{ role: 'user', content: task }]` to include parent context.

### P3: Separate Config from Execution

Stop overloading `execute({task: ''})` for config retrieval. Use MCP annotations or a dedicated metadata channel.

**Files**:
- `lib-vue/use-agent-sub-agent.ts` — separate config from execute
- `ui/src/composables/use-agent-chat.ts` — update `resolveSubAgents`

### P4: Structured Output (toModelOutput)

Implement `toModelOutput` so the main agent receives a compact summary while the UI shows full subagent reasoning. Reduces context pressure on the 24,000-char compaction threshold.

### P5: Server-Side Orchestration (Future)

Move orchestration from client to server for persistence, long-running tasks, and proper token attribution.

## Verification

Verification of future implementation:
- Unit test: subagent can yield intermediate results that the parent processes before subagent completes
- E2E test: extend `chat-subagent.e2e.spec.ts` to test multi-turn exchange
- Manual: open debug dialog, verify subagent traces show multiple exchange rounds
