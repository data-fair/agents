# Tool-output injection tripwire — design

Date: 2026-11-02. Branch: `chore-prompt-injection`.

> **Superseded in part (2026-11-03).** The classifier is now two-stage (a one-word screen, then a structured
> confirmation on a flag) and its wrapper tag carries a per-call nonce; the single `generateObject` call and the
> fixed `<tool_result_to_classify>` tag described below are gone. Current behaviour:
> [moderation.md, "Tool-output tripwire"](../../architecture/moderation.md#tool-output-tripwire).

## Intent

Prompt injection through tool output is the main open risk of the service. Recommending users not to combine
web reading with write or destructive tools does not work: users ignore advice that slows them down, and the
combination is exactly what unlocks the powerful use cases. What is in place today is static
(see [what exists](#what-exists)): nothing reacts to the content a turn has actually read.

This design adds a **tripwire**: every tool result that comes from outside is checked by a classifier before
the model sees it, and a result that looks like text addressed to an AI agent **stops the turn right there**,
with an explanation.

Why a classifier is worth it despite "The Attacker Moves Second" (Nasr, Carlini, Tramèr et al.,
arXiv 2510.09023, adaptive attacks bypassing 12 defenses at >90%): those attacks need many queries against the
defense and its verdict. Here the attacker plants content (a web page, a dataset row) and never sees whether it
tripped; each attempt that trips stops the run, leaves a record naming the source, and alerts someone. A
tripwire does not have to be unbeatable to raise the cost of an attack a lot. It is a detection layer, not the
control that allows an action — that is the deterministic gate of the [follow-up notes](#follow-up-notes).

Why it fits this product better than a coding agent: our agents read business content (datasets, catalog
metadata, web pages about the organization's domain). That content legitimately almost never addresses an AI
agent, gives it instructions, or tries to change its role. So the classifier can be tuned aggressively, and a
false positive is rare and cheap to review.

## Goals

- Every result of an outside-content tool is classified before it reaches the model, within a turn and in
  every surface (personal assistant, configured agent chat, planned task run, webhook-triggered run).
- On a suspected injection the turn stops immediately; the flagged result never reaches the model, not in this
  turn and not in later turns of the conversation.
- The person (chat) or the organization's admins (unattended run) learn what happened: which tool, which source
  (URL, dataset, server), and the flagged excerpt.
- The trip is recorded where admins already look (the run, the stored tool call, the review page).

## Non-goals

- Not the deterministic content-based gate or the automated approver ([follow-up notes](#follow-up-notes)).
- No "continue anyway" override in this version. If false positives make the feature unusable, the
  stop-on-trip decision is revisited as a whole (user decision, 2026-11-02).
- No change to the person-message moderation (`docs/architecture/moderation.md`), its opt-in, its categories or
  its strikes. This is a separate check on a separate input.
- No scanning of data a `code_mode` script handles internally: it never reaches the model. Only what reaches
  the model is scanned.
- No output moderation of what the agent writes.
- Page content that reaches the model outside tool results (host state and events, action-button hidden
  context, `docs/architecture/host-events.md`) is not scanned in this version. *(my call:)* it is the person's
  own page, re-sent on every turn, so a trip would need a different handling than a withheld tool result; the
  page tools' results are scanned. Recorded as a known gap.

## Anti-goals

- A tripwire that blocks normal business work: a classifier prompt that flags any imperative sentence
  ("Click here to download", "Contact the town hall before 5pm", procedure texts in a dataset) would make the
  feature unusable. The criterion is text that **addresses an AI agent / assistant / model**, or tries to
  change its instructions, persona, goal, or make it send, change or reveal something.
- Flagging trusted tool-usage guidance. Results legitimately carry text for the agent about using the tools
  themselves: openapi-mcp renders data-fair's `x-agent` column hints into every table ("use this key in filters,
  select, sort…", `openapi-mcp/src/render.ts`), our web tools say "call fetch_url again with saveAs…", code mode
  and the call path add their own notes. *(my call:)* the criterion is **diverting the agent from the person's
  task** — new goals, overriding or ignoring its instructions, a different role, sending / changing / revealing
  something the task did not ask for — not guidance on how to call a tool, page through a result or read a
  column. The prompt says so and the unit fixtures include these real hints as negatives. Stripping the hints
  before classifying was rejected: it needs an openapi-mcp output change and breaks "scan exactly what the model
  sees".
- A failure of the classifier taking the service down (see fail-open below).
- Feeding the flagged text back to the model in any form (including the excerpt in the stop notice the model
  will see in history).

## Decisions

### What is scanned

- **The result of every tool whose `openWorldHint` annotation is not `false`.** This is the MCP spec's own
  mechanism and its default: an absent `openWorldHint` means the tool may interact with an open world. So:
  - our web tools (`fetch_url`, `list_site_pages`, …: already `openWorldHint: true`, `api/src/web/tools.ts`);
  - `code_mode` (already `openWorldHint: true`, `api/src/code-mode/operations.ts`): its return value is scanned,
    which covers a script that read outside content and returns it;
  - external MCP servers and catalog servers, including data-fair's MCP: openapi-mcp declares no `openWorldHint`
    today (`openapi-mcp/src/load.ts`), so every data-fair tool result is scanned. Correct for dataset content,
    which can be harvested open data or rows written by any contributor. Data-fair can later declare
    `openWorldHint: false` on operations whose output is fully controlled (through `x-agent` annotations) to
    save the cost; that is a data-fair change, not part of this design.
  - page tools (WebMCP) carry no annotations in practice → scanned, consistent with the provenance envelope
    treating them as untrusted.
- **`read_file`** too, although it is `openWorldHint: false`: a file can come from a web download (`saveAs`),
  an MCP export or a person's upload. *(my call: files carry no reliable provenance today, and adding one is
  more work than scanning what is read.)*
- **Webhook payloads** that start a task run (`api/src/tasks/operations.ts`, the "DATA describing what
  happened" block) are scanned before the run's first model call.
- **Not scanned: `read_conversation`** and the other self-knowledge tools returning past transcripts (user
  decision, 2026-11-02). A transcript is mostly people instructing the agent, which is exactly what the
  classifier flags: scanning it would trip on nearly every call. Outside content in a past conversation was
  scanned when it first entered as a tool result, and a withheld result is stored only as its placeholder, so
  it never resurfaces. Other people's messages are an authority question, not a detection one, handled by
  speaker and role labels in the transcript (security review M3/M5). Known gap: a result that passed on
  fail-open can come back through a transcript.
- Self-knowledge tools today declare only `readOnlyHint` (`api/src/conversations/service-tools.ts`); the
  builder makes every service tool's `openWorldHint` explicit (`false` for all of them, `true` only for the web
  tools and `code_mode`) so the scan set is what this section says, not an accident of the MCP default.
- **Not scanned**: the service's own tools whose output it controls (explicitly `openWorldHint: false`: memory,
  planning, self-knowledge, `ls`, `write_file`, access requests), `read_skill` (server skills are instructions by nature:
  scanning them for "instructions to an agent" would always trip; catalog servers are trusted not to misdescribe
  their own tools, memory `catalog-servers-trusted`), and errors thrown by our own code.
- **Thrown tool failures** carry tool-authored text too (see `withProvenance`): they are scanned like results.

### What is sent to the classifier

Exactly the text the model would see, after the call path and the per-result bounds, before the provenance
envelope. Images are not scanned. A result longer than one classifier window is split into windows classified
in parallel; a cap on the total scanned per result applies, beyond which the rest is truncated *from what the
model sees* rather than passed unscanned. *(Window size and cap: builder's call, sized against the moderator
model's context and the existing result bounds in `step-context.ts`; the cap must never let unscanned text reach
the model.)*

### The classifier

- **Model**: the `moderator` role, resolved as moderation does (moderator → summarizer → assistant,
  `resolveRoleModel`), reasoning disabled (`withReasoningDisabled`, `api/src/moderation/service.ts`).
- **Call**: `generateObject` with a small verdict schema (suspected yes/no, a short excerpt of the offending
  text, a one-line reason). Metered through `chargeModelCall` under role `moderator`, added to the run's spend
  and telemetry like the moderation gate.
- **Prompt**: fixed, server-side, generic; never the agent's instructions, never the conversation. Only the
  tool name, its server label and the result text, the text clearly delimited as content to classify.
- **Fail open**: on classifier error or timeout the result passes (to the model, in its envelope as today).
  The scanner is a tripwire; the control that must fail closed is the follow-up gate. Each fail-open is
  recorded (telemetry), so a broken moderator model is visible. A "suspected" verdict that arrives after the
  result already passed is **recorded only** (on the stored part and the run, like moderation's `late-block`),
  not acted on in the current turn: the scan keeps running to its hard cap so it settles. The stored part is
  still switched to the placeholder, so later turns and transcripts no longer carry it. *(my call: stopping mid-turn on a late
  verdict needs a second stop path for a rare case.)* *(Timeout value: builder's call, in the range
  of moderation's 3.5 s; the scan blocks the result, so it adds latency to every scanned call.)*
- **Always on** whenever a moderator model resolves, independent of `settings.moderation`. A deployment-level
  config switch turns it off (`config`, for an incident or a deployment without a usable small model).
  *(my call: the switch is for operators, not an org setting, so an org cannot opt out of a security layer for
  its users; revisit if cost becomes an issue.)*

### On a trip

- **The tool call is settled as an error** whose text the model never receives verbatim: the stored part keeps
  the call and a fixed placeholder output ("withheld: the tool result looked like instructions addressed to an
  AI agent"), and the original result is not stored in the part the replay reads. *(Whether the original
  result is kept elsewhere for admin review — e.g. in the trip record — is the builder's call, bounded like
  moderation's excerpts; at least the classifier's excerpt is kept.)*
- **The turn stops right after that step**, as the loop guards do (`stopWhen`, `api/src/conversations/loop-guards.ts`),
  with a new stop reason `injection-suspected` (added to `conversation-run/schema.js`). Other calls of the same
  parallel step may complete; their results are scanned too.
- **The person sees a notice** appended to the message (`runStopReasonMessage`): which tool, which source (the
  URL for web tools; server and tool for MCP calls, with their main arguments), and that the result was withheld
  and the turn stopped as a precaution. The excerpt is shown to the person in the UI (a block on the stopped
  call) but **never placed in the text the model reads in later turns**: the notice the model sees names the
  source, not the content.
- **The conversation can continue** after a trip: the person may write again; the flagged result stays
  replaced by its placeholder in history.
- **A task / webhook run** ends with status `error` and the stop reason; the existing `failed` task
  notification is pushed (`taskEvent`, `api/src/tasks/notifications.ts`) with a body naming the suspected
  injection and its source, and it counts towards the consecutive-failure pause. Admins subscribed to the
  agent's `injection-suspected` topic (below) hear of it too, so one subscription covers every trip of an agent. *(my call: reuse `failed`
  rather than a new topic, one notification path; a distinct topic is cheap to add if admins want to subscribe
  to security events alone.)*
- **A configured agent's chat** also notifies the organization's admins through data-fair events, by the
  same path as task runs (`pushTaskEvent`'s queue, `taskEvent`'s shape), whoever the interlocutor is (user
  decision, 2026-11-02): the person chatting may be the one who planted the content. Topic keyed per agent,
  in the task events' `<service>:<kind>:<id>` shape (*my call:* `agents:injection-suspected:<agentId>`), in
  French like the others, linking to the run on the agent's page. A personal assistant's trip notifies only
  the person, who is the one it acts for. *(my call.)*
- **The record**: the stored tool part carries a `tripwire` entry (verdict, excerpt, reason, classifier model)
  next to its annotations, so the admin review page and the conversation export show it.

### Where it hooks

One place every outside result passes through: the tool wrapper that builds the provenance envelope
(`withProvenance` / `modelTools`, `api/src/conversations/operations.ts`), used by both loops and by page tools
(`api/src/agent-session/browser-tools.ts`). The scan happens on the raw result before wrapping; the turn's stop
is signalled to the loop (the shape of that signal — a flag read by a `stopWhen` condition like
`budgetExceeded`, or a dedicated error — is the builder's call). The code-facing tools used inside scripts
(`codeExecute`) are **not** scanned: only `code_mode`'s own result is.

### Tests

- The mock model (`api/src/models/mock-model.ts`) needs a deterministic moderator verdict for the tripwire
  prompt, keyed on a marker in the scanned text, as moderation's mock does.
- The MCP fixture (`tests/support/mcp-fixture.ts`) gets a tool returning an injected result.
- API specs: a configured agent's chat trip pushes its `injection-suspected` event (the test-env events seam,
  `api/src/test-env/router.ts`); a chat stops with `injection-suspected`, the model never received the text (the run's recorded
  model input), the conversation continues with the placeholder; a task run ends in error and pushes its
  `failed` event; classifier timeout fails open; a `code_mode` script returning injected text trips.
- Unit specs on the windowing / cap and on the classifier prompt formatting.
- A few injection cases in `simulations/cases` (an injected web page, an injected dataset row), as the
  2026-10-14 security review recommended; judged on whether the agent stopped and explained, and on false
  positives over existing benign cases.

### Documentation

`docs/architecture/moderation.md` gains a section on the tripwire (it shares the moderator role, the call path
and the metering), citing the sources below; `web-access.md`, `mcp-tools.md` and `code-mode.md` reference it
where they discuss injection.

## What exists

For the builder, the layers this sits beside (all in `docs/architecture/`): the provenance envelope and the
data clause in the system prompt (`mcp-tools.md`), defused envelope tags, remote images blocked in the chat
and by the CSP (`web-access.md`), the admin-approved web allowlist as exfiltration control, NHI scopes,
signed approvals bound to arguments and the annotation-driven approval levels (`autonomous-agents.md`),
unattended runs dropping gated tools (`planned-tasks.md`), memory provenance (`agent-memory.md`), the
compaction recap restating the data rule (`context-management.md`), and the 2026-10-14 security review
(`docs/superpowers/specs/2026-10-14-security-review.md`, Rule of Two table).

## Follow-up notes

Not built here; recorded so the next pass starts from what was decided.

### Content-based approval gate (deterministic)

Meta's "Agents Rule of Two" (2025-10-31): at most two of untrusted input, sensitive data, state change /
external communication, without a human. Today the approval level is static per agent, so an admin who sets
`destructive` or `none` and turns web access on gets a warning in the form only.

- A turn is **exposed** from the moment an outside-content result (same definition as the tripwire's scan set:
  `openWorldHint` not `false`, plus files) enters it.
- In an exposed turn, write and destructive catalog calls go through a stricter policy than the agent's
  level: ask (chat) or the approver below, and in an unattended run drop or require the approver. Deterministic,
  no model involved in the decision of *whether* to gate.
- Taint must propagate into `code_mode`: a script that reads outside content and then writes in the same
  script is the same exposure. Today scripts cannot call gated tools at all (approval needs a person); the gate
  would make more tools gated in exposed turns, which scripts would then also lose.
- Open: which data-fair tools return outside content (openapi-mcp `x-agent` `openWorldHint` declarations), and
  how to state the stricter policy per approval level. Ask the user for the use case they least want slowed
  down (what the agent reads, what it then changes) before designing it.

### Automated approver

After Claude Code auto mode (Anthropic, 2026-03: people accept 93% of permission prompts; a classifier replaced
the human approver; 0.4% false positives, 17% false negatives on real overeager actions) and Chrome's User
Alignment Critic (Google, 2025-12, sees only action metadata).

- An LLM call that sees the person's own messages (or the task's prompt) and the proposed call (tool,
  arguments, annotations), **never tool outputs or the assistant's own text**: that stripping is its injection
  defense.
- Model: the `moderator` role, like the tripwire; a deployment should point it at a capable model (Anthropic
  runs it on Sonnet), since false negatives need judgment.
- **Fails closed**: error or timeout → ask a person in chat, drop the call in an unattended run.
- It is what makes the content-based gate bearable in chat, and the only way an unattended run could still
  write after reading outside content.

### Other measures surveyed, not planned

- Stricter `fetch_url` rule inside allowed hosts (OpenAI link safety, 2026-01: fetch only a URL seen verbatim
  earlier or publicly indexed, no data-bearing query strings).
- Treat changes that make data public (dataset / portal permissions, publication) as external communication,
  not ordinary writes — a data-fair integration point (openapi-mcp annotations).
- Freeze a planned task's tool set (and target resources) at approval time (plan-then-execute,
  Beurer-Kellner et al. arXiv 2506.08837).
- Memory writes from an exposed turn (`agent-memory.md`, open security note 1).

## Sources

- Willison, "The lethal trifecta" (2025-06): https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/
- Meta, "Agents Rule of Two" (2025-10-31): https://ai.meta.com/blog/practical-ai-agent-security/
- Beurer-Kellner et al., design patterns: https://arxiv.org/abs/2506.08837 ; CaMeL: https://arxiv.org/abs/2503.18813 ; FIDES: https://arxiv.org/abs/2505.23643
- Nasr, Carlini, Tramèr et al., "The Attacker Moves Second": https://arxiv.org/abs/2510.09023
- Anthropic, prompt injection defenses (2025-11, classifiers on untrusted context, 1.4% adaptive ASR on Opus 4.5): https://www.anthropic.com/research/prompt-injection-defenses ; Claude Code auto mode (2026-03): https://anthropic.com/engineering/claude-code-auto-mode
- OpenAI, Atlas hardening (2025-12): https://openai.com/index/hardening-atlas-against-prompt-injection ; link safety (2026-01): https://openai.com/index/ai-agent-link-safety ; Lockdown mode (2026-02): https://openai.com/index/introducing-lockdown-mode-and-elevated-risk-labels-in-chatgpt/
- Google, Gemini layered defense (2025-06): https://blog.google/security/mitigating-prompt-injection-attacks/ ; Chrome agent (2025-12): https://blog.google/security/architecting-security-for-agentic/
- Microsoft MSRC, indirect injection defenses (2025-07): https://www.microsoft.com/msrc/blog/2025/07/how-microsoft-defends-against-indirect-prompt-injection-attacks ; Spotlighting: https://arxiv.org/abs/2403.14720
- Detector limits: LlamaFirewall / Prompt Guard 2 https://arxiv.org/abs/2505.03574 ; WAInjectBench https://arxiv.org/abs/2510.01354 (explicit injections caught, implicit ones largely missed)
- OWASP LLM01:2025 https://genai.owasp.org/llmrisk/llm01-prompt-injection/ ; Agentic Top 10 2026 https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/

Not verified (press or secondary sources only): later Anthropic model figures, OpenAI IH-Challenge numbers,
whether Chrome's Critic is live.
