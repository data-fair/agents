# Conversation history compaction

When serialized history exceeds **24KB** (~8k tokens, 10-15 turns), it is automatically summarized before the next LLM call.

```mermaid
sequenceDiagram
  participant Chat as use-agent-chat
  participant API as /summary/:type/:id
  participant LLM as Summarizer model

  Chat->>Chat: history > 24KB?
  alt Under threshold
    Chat->>Chat: proceed normally
  else Over threshold
    Chat->>API: POST {content: history[0..n-1], prompt}
    API->>LLM: generateText(summarizer model)
    LLM-->>API: summary text
    API-->>Chat: {summary}
    Chat->>Chat: history = [summary_msg, last_user_msg]
    Note over Chat: context reduced from N messages to 2
  end
```

**The last user message is always preserved verbatim** — only prior history is summarized. This keeps the user's latest intent intact while dramatically reducing context size.

The threshold is overridable via `sessionStorage.setItem('agent-chat-compaction-threshold', ...)` for testing.

