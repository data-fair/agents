export default {
  $id: 'https://github.com/data-fair/agents/conversation-run',
  'x-exports': ['types'],
  title: 'Conversation run',
  type: 'object',
  additionalProperties: false,
  required: ['id', 'agentId', 'kind', 'owner', 'trigger', 'status', 'startedAt'],
  properties: {
    id: { type: 'string' },
    agentId: { type: 'string' },
    // A run is of one of two kinds. A 'conversation' run is one turn of a conversation and carries its
    // `conversationId`. A 'task' run is one execution of a planned task: no conversation, its content
    // (`prompt`, `parts`, `outcome`) lives on the run itself.
    kind: { type: 'string', enum: ['conversation', 'task'] },
    conversationId: { type: 'string' },
    taskId: { type: 'string' },
    // A task run: the message the task gave the model, and what the model produced.
    prompt: { type: 'string' },
    // A task run: the task's title as it ran, which heads the message the model is given (taskTurnText,
    // api/src/tasks/run-messages.ts). A later rename must not change what the run's record says was sent.
    taskTitle: { type: 'string' },
    parts: { type: 'array', items: { type: 'object' } },
    // What a task run reported through report_outcome.
    outcome: {
      type: 'object',
      additionalProperties: false,
      required: ['status', 'summary'],
      properties: {
        status: { type: 'string', enum: ['done', 'nothing-to-do', 'needs-attention'] },
        summary: { type: 'string' }
      }
    },
    // A task run: the slot it was due for.
    scheduledFor: { type: 'string', format: 'date-time' },
    owner: {
      type: 'object',
      additionalProperties: false,
      required: ['type', 'id'],
      properties: {
        type: { type: 'string', enum: ['user', 'organization'] },
        id: { type: 'string' },
        name: { type: 'string' },
        department: { type: 'string' }
      }
    },
    // 'user': the person wrote. 'wake': the person ACTED on a handover (wait_for_user_action), and the
    // turn continues from what they did — no message of theirs, so no moderation.
    // 'schedule', 'manual' and 'webhook' are the triggers of a TASK run: its slot came due, an admin ran it
    // now, or its trigger URL was called.
    // 'approval': a person decided on a pending approval, and the turn continues from the decision.
    trigger: { type: 'string', enum: ['user', 'wake', 'approval', 'schedule', 'manual', 'webhook'] },
    triggeredBy: {
      type: 'object',
      additionalProperties: false,
      properties: { userId: { type: 'string' }, userName: { type: 'string' } }
    },
    // The effective role the triggering person held, for quotas and usage attribution.
    //
    // Only the PERSONAL assistant needs it, and it is the difference between a quota that applies and one
    // that does not. A configured autonomous agent is an org-owned service identity: it is billed as
    // the agent at role 'admin', because no per-profile quota is meant to apply to it. The personal
    // assistant acts AS the person, so the person's own role is what bounds their spend — without this,
    // every chat turn resolved to 'admin' and the per-role quotas were silently unenforced, and every
    // person's usage was recorded against one `autonomous-agent:personal` row.
    //
    // Stored on the run rather than recomputed by the executor because only the HTTP/socket boundary
    // has the session to derive it from.
    triggeredByRole: { type: 'string', enum: ['admin', 'contrib', 'user', 'external', 'anonymous'] },
    /**
     * Telemetry for each MODEL CALL this turn made.
     *
     * The one thing the old `trace-requests` collection held that the conversation cannot: a turn is
     * N model calls, while the conversation keeps one message for the whole turn, so per-call
     * provider, model, tokens, cost and duration have no other home. Everything else that collection
     * stored — who said what, the tool calls and their results — IS the conversation.
     *
     * Bounded by the step limit, so this array cannot grow without limit the way a message can.
     */
    calls: {
      type: 'array',
      default: [],
      items: {
        type: 'object',
        required: ['modelRole', 'model'],
        properties: {
          modelRole: { type: 'string' },
          model: { type: 'string' },
          provider: { type: 'string' },
          providerType: { type: 'string' },
          inputTokens: { type: 'number' },
          outputTokens: { type: 'number' },
          cacheReadTokens: { type: 'number' },
          cacheWriteTokens: { type: 'number' },
          credits: { type: 'number' },
          // Split by token class, because the total alone cannot show that cache reads were billed
          // at the cached rate — which is the thing most easily got wrong and least visible when it
          // is. `cachedInput` is part of the input spend, not a separate charge.
          creditsInput: { type: 'number' },
          creditsCachedInput: { type: 'number' },
          creditsOutput: { type: 'number' },
          durationMs: { type: 'number' },
          finishReason: { type: 'string' },
          // Why a call left no verdict behind: 'tripwire-fail-open' is a tool-output classification that errored
          // or timed out, so the result passed unscanned (api/src/tripwire/service.ts). What makes a broken
          // moderator model visible.
          note: { type: 'string' },
          // How much context this call actually sent, which is how context management is diagnosed:
          // a recap replacing a covered prefix shows up as a messageCount below the number of stored
          // messages, and clearing shows up as inputTokens far below the stored size. Counts and a
          // seq bound, so no content.
          messageCount: { type: 'number' },
          historyUpToSeq: { type: 'number' },
          // What the model COULD do, which the conversation cannot show: it records the calls made,
          // never the tools offered. The union over the turn's steps, since the page's tools are live
          // and may change between steps. Names only, sorted.
          toolNames: { type: 'array', items: { type: 'string' } },
          // Where each of those tools came from (shared/tool-source.ts), by name: what the chat's inspection
          // dialog groups them by. Absent on runs recorded before it existed.
          toolSources: {
            type: 'object',
            additionalProperties: {
              type: 'object',
              additionalProperties: false,
              required: ['kind'],
              properties: {
                kind: { type: 'string', enum: ['platform', 'catalog', 'external', 'page', 'service'] },
                server: { type: 'string' }
              }
            }
          },
          // How much page state and page events this call carried (the host blocks folded into the
          // person's message at call time, which are not stored with it). The one measure of how
          // much a host page talks to the model.
          hostBlockChars: { type: 'number' },
          // The system prompt is per TURN, not per call, so it is recorded once below rather than
          // repeated on every entry.
          steps: { type: 'number' }
        }
      }
    },
    /**
     * The instructions the model was given, recorded once per run.
     *
     * Reviewable without a second store, and the thing `reconstruct-trace` used to dig out of a
     * request body by filtering for a system-role message.
     */
    systemPrompt: { type: 'string' },
    /**
     * What the page in front of the person told the model this run: the state and event blocks folded
     * into the last user message at call time. Not stored with that message, so this is its only record.
     * Absent when the page said nothing, and on runs recorded before it existed.
     */
    hostContext: { type: 'string' },
    /**
     * WHAT THE MODEL READ THAT THE STORED MESSAGES DO NOT SAY (docs/architecture/context-management.md,
     * "What a run records"). The messages are the conversation of record, never rewritten; the model is sent a
     * transformed view of them. Each transformation records here what it did, as it does it, so a reviewer
     * and an exported transcript can tell what the model actually had in front of it. Absent on runs recorded
     * before it existed. Steps are counted from 1, the turn's first model step.
     */
    context: {
      type: 'object',
      additionalProperties: false,
      properties: {
        // The compaction recap the turn's history began with: the messages up to `coversUpToSeq` were not
        // sent, this summary was. `summary` is on the run that wrote the recap (and on a run reading one written
        // before runs recorded it); the others name its generation, the summary being the same.
        recap: {
          type: 'object',
          additionalProperties: false,
          required: ['generation', 'coversUpToSeq'],
          properties: {
            generation: { type: 'number' },
            coversUpToSeq: { type: 'number' },
            summary: { type: 'string' },
            // Set on the run that wrote it.
            written: { type: 'boolean' }
          }
        },
        // Tool results the model was sent a placeholder for instead, from the given step on: cleared to free
        // context ('cleared'), or an image not sent ('image-earlier': a later image replaced it; 'image-unsupported':
        // the model does not read images). A result of an earlier turn appears in each turn that did not send it.
        removed: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['toolCallId', 'step', 'reason'],
            properties: {
              toolCallId: { type: 'string' },
              step: { type: 'number' },
              reason: { type: 'string', enum: ['cleared', 'image-earlier', 'image-unsupported'] }
            }
          }
        },
        // What a step was given beyond the stored messages: instructions other than `systemPrompt` (rebuilt when
        // the page's skills changed mid-turn, or with the tripwire's explanation request), and a message the loop
        // added after the history (the repeated-call reminder).
        steps: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['step'],
            properties: {
              step: { type: 'number' },
              instructions: { type: 'string' },
              injected: { type: 'string' }
            }
          }
        }
      }
    },
    /**
     * The tools the model was offered this run, with their descriptions and input schemas: the key of a
     * `tool-definitions` document (api/src/conversations/tool-definitions.ts), stored once per distinct set,
     * since most runs of an agent are offered the same set. Absent on runs recorded before it existed.
     */
    toolDefinitionsRef: { type: 'string' },
    status: { type: 'string', enum: ['running', 'done', 'error', 'aborted', 'interrupted', 'skipped'] },
    // 'waiting': the turn handed over to the person (wait_for_user_action) and ends there; their action
    // starts the next one. Not 'completed', which would read as work finished.
    // 'awaiting-approval': a call needs the person's approval; the turn ends there and their decision starts the next one.
    stopReason: { type: 'string', enum: ['completed', 'waiting', 'awaiting-approval', 'step-limit', 'repeated-calls', 'budget', 'injection-suspected', 'review-denied', 'timeout', 'aborted', 'error'] },
    error: { type: 'string' },
    // A stop asked for while the run was `running`, by whichever API process received it: the process
    // driving the turn polls its own run for it (see driveTurn), so a stop reaches a turn held by another
    // instance. `abortReason` is the stop's cause (StopCause, api/src/conversations/interrupted-turn.ts),
    // so the turn is settled with the same cause a local stop gives.
    abortRequestedAt: { type: 'string', format: 'date-time' },
    abortReason: { type: 'string', enum: ['stop', 'agent-stopped', 'person-spoke'] },
    steps: { type: 'number', minimum: 0 },
    credits: { type: 'number', minimum: 0 },
    startedAt: { type: 'string', format: 'date-time' },
    endedAt: { type: 'string', format: 'date-time' }
  }
}
