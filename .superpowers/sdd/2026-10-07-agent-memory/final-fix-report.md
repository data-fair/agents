# Final-review fixes (agent memory)

- I1: confirm text en+fr now says redaction blanks history rows only (AgentMemoryDialog.vue:201,223, YAML-quoted); agent-memory.md Redaction bullet; architecture plan section 8 item 9 (git add -f). Covered: doc/UI text only (no behaviour).
- I2: Memory button no longer gated on memory.enabled (AutonomousAgentsSection.vue ~84); doc updated. Test: memory.e2e.spec.ts "Memory button stays for an agent with memory off".
- I3: conversation-review.md API section, list description, 404 sentence, long line rewrapped.
- M1: deleteMemoryStore run again at end of deleteAutonomousAgentData (autonomous-agents/service.ts ~141-165). Not directly testable deterministically; existing delete cascade/in-flight reflection tests pass.
- M2: note in agent-memory.md (limits paragraph).
- M3: purgeExpiredArchives(now, scope) / sweepIdleReflections(now, batch, scope); app.ts seams default owner.id /^test/ (optional body.owner.id). Covered by audited.api and reflection.api specs.
- M4: AgentChatDebugDialog.vue `audited` prop (AgentChat.vue passes it): no consent toggle, review link for admins. Test: audited.e2e.spec.ts new test.
- M5: memory switch description en+fr, build-types run.
- M6: collection names in agent-memory.md; comment in review/router.ts ~117.
- M7: renderMemoryBody shared; reflectionUserMessage omits the clause (operations.ts). Test: reflection.unit.spec.ts.
- M8: isPageTool -> mayBePageTool (executor.ts).
- T1: audited.e2e asserts the consent sheet text is absent.

Results: lint 0 errors (1 pre-existing warning); check-types clean; unit 1000 passed; api 374 passed; e2e 141 passed in the end (first full run: 21 failed because my unquoted YAML in the i18n block broke the UI build; fixed by quoting; second full run 140 passed + 1 new test I then fixed and re-ran alone: passed).
