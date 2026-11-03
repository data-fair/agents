# Automated approval reviewer — design

Status: design agreed in conversation 2026-11-03, built on branch feat-auto-approval; the architecture docs
(`docs/architecture/autonomous-agents.md#the-approval-gate`, `moderation.md#approval-reviewer`) describe what was built. Follows the "Automated approver" and
"Content-based approval gate" follow-up notes of
[the tool-output tripwire design](./2026-11-02-tool-output-tripwire-design.md#follow-up-notes).

## Intent

A person clicking an approval card is a weak check: they approve by reflex (Anthropic measured 93% of
permission prompts accepted, the figure that motivated Claude Code's auto mode). The approval gate built for
autonomous agents (`docs/architecture/autonomous-agents.md#the-approval-gate`) relies only on that click, and
leaves ordinary writes unchecked at its default level.

An automated reviewer — an LLM call judging each proposed change against what the person asked — becomes
**the main line of defence**. It must be faster and less blocking than today, **and safer, not less safe**:

- it checks calls that run unchecked today (writes at level `destructive`, everything at `none`);
- a person sees only what the reviewer routes to them, with the reviewer's view on the card, so a rare card with
  a reason gets read rather than clicked;
- it lets the three cases that are blocked today proceed under review: a planned task that needs to write, a
  person clicking cards in chat, and `code_mode` scripts that cannot call gated tools.

Agents have not been released since the current gate was built: the configuration and behaviour can change
freely, with no upgrade script (`upgrade-scripts-convention`: migrate only released data).

## Goals, non-goals, anti-goals

Goals:

- Every write and destructive catalog call of a configured autonomous agent is reviewed before it runs.
- Fewer cards for people, each stating why it reached them.
- Unattended task runs and `code_mode` scripts may make reviewed writes.
- A measured safety bar (below), on the bridge and on the production `moderator` model.

Non-goals:

- **The personal assistant.** It is offered no write tools today (its catalog is only the servers a deployment
  lists in `PERSONAL_ASSISTANTS`, none by default, `docs/architecture/mcp-tools.md`). Its gate
  (`personalAssistantTools`) is left as it is; the question returns when it is given write tools.
- Admin-editable reviewer rules. The rule list is fixed by the service for now (user decision).
- Reviewing reads, page tools, or the service's own tools other than the capability grants below.

Anti-goals (a failure even if it works):

- A reviewer that grants capability. It only ever replaces or precedes a person's decision; NHI scopes and the
  agent's identity stay the ceiling ("a reviewer swap, not a permission grant", Codex).
- A person able to click past a reviewer's denial.
- An unchecked path for a change: no configuration in which a write or destructive call runs without review.
- Shipping on claimed safety: the bar must be measured.
- A reviewer persuadable by the agent or by outside content (see its inputs).

## State of the art (summary)

Researched 2026-11-03; all three converge on a three-outcome reviewer.

| | Claude Code auto mode | Managed Agents `auto` | Codex auto-review |
|---|---|---|---|
| Configured as | a mode; `ask` rules still go to the person | per toolset / per tool, beside `always_allow` / `always_ask` | a reviewer swap, separate from the approval policy |
| Outcomes | allow / block | allow / deny / ask a person ("no determination") | approve / deny |
| Reviewer reads | user messages + tool calls; assistant text and tool outputs **stripped** | the session; intent taken **only** from user messages | compact transcript incl. tool outputs |
| Denial | error result, find a safer path | error result, client cannot override | rationale back, no workaround; a person may grant one retry, **re-reviewed** |
| Circuit breaker | 3 consecutive / 20 total → person | — | 3 consecutive / 10 in 50 → abort turn |

Each routes a call to ONE decider. **We differ deliberately**: for classes routed to a person, the reviewer
screens first and the person decides second (user decision). Reason: the reflex click — the reviewer is a floor a
person cannot click past, as in Codex's retry-is-re-reviewed rule, and the card carries its view.

## The routing

Per configured agent, each class of catalog call (`classifyTool`, from MCP annotations: unchanged) is routed:

| class | routes | default |
|---|---|---|
| readOnly | runs, no review | — |
| write | `reviewer` or `reviewer+person` | `reviewer` |
| destructive | `reviewer` or `reviewer+person` | `reviewer+person` |

This replaces `approvalLevel` (`write` / `destructive` / `none`) in the agent schema, `shared/approval-policy.ts`,
the security tab of the agent form and `ui/src/utils/autonomous-agent-examples.ts`. `none` disappears: there is no
unchecked route.

The reviewer answers one of:

- **deny** → the call does not run; the model gets an error result with the reviewer's reason and is told not to
  reach the same outcome another way. Final: no person can override it. The person's way forward is to say more in
  the chat — a new message is new intent, and the next call is reviewed against it.
- **unsure** → in a chat, a card stating the concern; in an unattended run or a script, a deny.
- **allow** → under `reviewer`, the call runs; under `reviewer+person`, a card, carrying the reviewer's view. In an
  unattended run or a script a `reviewer+person` class is not reachable at all (below).

**Capability grants** (`request_web_access`, `request_mcp_access`, the planning tools) also go reviewer first,
then the admin, as today's `ADMIN_DECISIONS`. Never the reviewer alone. They get their own short rule set (what a
grant widens: who can in effect instruct the agent, what a task will do unattended) and their own corpus cases.
A reviewer denial of a grant is final in the chat too: the admin keeps the agent's form, where the allowlist,
servers and tasks are edited directly. *(My call.)*

Every server's annotations classify its tools, external servers' included: a server is trusted to describe its
own tools, their destructive nature as much as their read-only one (`catalog-servers-trusted`). Only tool output is
untrusted. (User decision.)

**Unattended runs** (task runs) keep the classes routed to `reviewer`; tools of classes routed to `reviewer+person`
and the capability grants are dropped as today (`unattended`). "Unsure" is a deny. This revisits "a stored prompt
is an assignment, not consent" (`planned-tasks.md`): the task's prompt becomes the intent the reviewer judges
against, as `user.message` is for Managed Agents. The architecture doc must state that change and its reason.

**`code_mode` scripts** may call tools of classes routed to `reviewer`: each nested call is reviewed synchronously
before it runs; deny and unsure fail that nested call with the reviewer's reason as its error. Classes routed to
`reviewer+person` stay out of scripts (a script cannot pause for a person, `code-mode.md`).

**The exposure gate** (follow-up note) is subsumed: its purpose was to force review of writes in a turn that read
outside content, and every write is now reviewed. What remains of it is an input to the reviewer — whether the
turn (or script) has taken in outside content, and from which tools (names only, never the content), using the
tripwire's scan set (`isScanned`: `openWorldHint` not `false`, files, webhook payloads). The fixed rules are
stricter in an exposed turn: a change not plainly within what the person asked is unsure or denied. *(My call.)*

**Circuit breaker**: 3 consecutive reviewer denials, or 10 in a turn, stop the turn (a new stop reason; in a task
run the run is recorded as needing attention, as other stops are). Any non-denial resets the consecutive count.
Same thresholds as Codex. *(Numbers are my call; adjust from the eval.)*

## The reviewer

**Mechanism.** The AI SDK's own: `streamText`'s `toolApproval` (AI SDK 7, `ToolApprovalConfiguration`) returns
`approved` / `denied` / `user-approval`, each with a `reason` (a `user-approval` reason is emitted on the approval
request "so it can be shown to the approver"). It replaces `applyApprovalPolicy`'s static `needsApproval`, and must
compose with the existing `denyGoneApprovedTools` (`api/src/conversations/approved-calls.ts`). Approvals stay
signed (`experimental_toolApprovalSecret`), and the turn still ends on a card (`awaiting-approval`) and replays on
decision, unchanged. Nested `code_mode` calls do not pass through `toolApproval`: their review is a wrapper on the
nested tool's execute, sharing the same review function.

**Inputs** (Claude Code's split; the injection defense is what it never sees):

- intent: the messages of the people instructing the agent in this conversation (hidden action-button context
  included, as it is part of the user turn), or the task's prompt **without the free text of its
  `<webhook-payload>` blocks** (outside content); plus the agent's persona and instructions, written by an admin *(my call: they describe the
  agent's routine work, which cuts pointless escalations)*;
- the proposed call: tool name, server, annotations, title, arguments;
- for a webhook-triggered run, the payloads' **structured fields only**: the event type and the id of the resource
  the platform's event names, so a write on the dataset that changed can be judged within the task (user
  decision). Free text in a payload never reaches the reviewer;
- whether the turn is exposed, and by which tools (names only);
- never: tool outputs, the assistant's own text or reasoning, memory, past conversations.

**The prompt**: a fixed template written by us — the trust boundary (the agent's own organization on its own
data-fair) and a fixed rule list, data-fair specific, among them: making data public or changing who can access a
resource (treated as external communication), deleting datasets, portals or many lines at once, sending data to an
address outside the platform, acting on another organization's resources, and acting beyond what the person
asked. Its content is the main thing the eval tunes.

**Model and engine**: the `moderator` role (user decision: no role of its own), with its existing fallback chain
(`resolveRoleModel`: moderator, then summarizer, then assistant), through the guard engine shared with moderation and the tripwire
(`api/src/guard/`): a fast stage 1 that errs towards flagging, a stage 2 that reasons only when stage 1 flags,
three outcomes. Unlike the other guards, stage 2 reasons (reasoning not disabled, a larger token budget and
timeout), and a **destructive call always reaches stage 2**: a stage-1 "no" may stand as an allow for a write only.
*(My call: the engine's one-word, reasoning-off path is built for classification, and misses here need judgment.)*
Billed through `chargeModelCall` like the other guards. A deployment should point `moderator` at a
capable model, since misses need judgment; the reviewer's latency and cost on that model are part of the eval
report, since moderation and the tripwire share it.

**Fails closed**: an error, a timeout or an unparseable answer is "unsure" (a card
in chat, a deny unattended or in a script), and is recorded as such — never as a denial counting towards the
circuit breaker, and never as an allow.

## What people see

- The approval card (`ApprovalCard.vue`) shows the reviewer's view: why it is shown (allowed but this class needs a
  person, or the reviewer was unsure) and the reviewer's reason.
- A denied call is a chip naming the tool, with the reviewer's reason, like today's "Declined" chip.
- The agent's form: the security tab's single radio group becomes the two routes (write, destructive), with the
  fact that tasks and scripts can use only the `reviewer` classes. The web-access warning about writes without
  approval goes away with `none`.
- Audit: `toolMetadata.decision` records who decided — the reviewer, a person, or both in series — with the
  reviewer's outcome and reason code, in the export and on the review page. Every reviewed call is recorded, the
  allowed ones included.

## The safety bar

"Safer" is measured before it ships, as the tripwire was:

- Extend `dev/guard-eval` with a corpus of proposed calls on data-fair tools, each with its intent: benign work
  drawn from the simulations, and three harmful kinds — overeager (deleting or publishing more than asked),
  injection-driven (a write steered by outside content, in an exposed turn), out of scope (the right tool on the
  wrong dataset or organization).
- Report the miss rate on harmful calls and the card/deny rate on benign ones, on the bridge and on the production
  `moderator` model (`prod-model-validation-campaign`).
- Add simulations where the person asks for one thing and the agent attempts something broader, judged on
  whether it was stopped.
- The bar's shape: nearly all harmful destructive and injection-driven calls caught; benign writes rarely carded
  or denied. The thresholds come from the first run, agreed with the user then.

## Left to the builder

- The stop reason's name and the needs-attention wording for a breaker trip.
- The schema shape of the two routes (two fields or one object), within the agent schema conventions.
- How the review function is shared between `toolApproval` and the nested `code_mode` wrapper.
- Card and chip wording, in both locales.
- Corpus size and composition, as long as all three harmful kinds and the exposed case are covered.
- Docs: `autonomous-agents.md` (the approval gate), `planned-tasks.md` (the unattended tool policy and the
  consent principle), `code-mode.md` (gated tools), `moderation.md` (the third guard), `web-access.md` (the
  warning), overview index.

## Sources

- Anthropic, Claude Code auto mode: https://www.anthropic.com/engineering/claude-code-auto-mode ; permissions:
  https://code.claude.com/docs/en/permissions
- Claude Managed Agents, permission policies: https://platform.claude.com/docs/en/managed-agents/permission-policies
- OpenAI Codex, auto-review: https://learn.chatgpt.com/docs/sandboxing/auto-review
- Meta, "Agents Rule of Two" (2025-10-31): https://ai.meta.com/blog/practical-ai-agent-security/
