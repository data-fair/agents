# Autonomous agent admin UI rework: implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:**
- Creation of an autonomous agent asks only for a name, an organization role and a starting example, and creates the agent's NHI in the same click.
- The agent page becomes a header, a tabbed **Configuration** block with Save in its bar, and an **Activité** block.
- Approvals become one level.
- The NHI's name and role are kept in sync from this UI.

**Architecture:**
- **Approvals.** The three-class `approvals` object is replaced by one `approvalLevel` enum. It is mapped onto the existing tool classes in `shared/approval-policy.ts`, so the server and the form share one mapping.
- **Form slices.** The configuration form is split into four vjsf slices of the autonomous agent schema, following the settings precedent (`api/doc/settings/org-form-part.js` + `OrgConfigSection.vue`): one draft, one diff, one Save.
- **NHI management** stays client-side against simple-directory's existing NHI routes, which need no change:
  - `POST /api/organizations/:id/nhis` (create)
  - `PATCH /api/organizations/:id/nhis/:nhiId` with `{ name?, role? }` (update)
  - `DELETE /api/organizations/:id/nhis/:nhiId` (delete)
  - `GET /api/organizations/:id/roles` (the organization's roles)

**Tech Stack:** Vue 3 + Vuetify + vjsf 4 (compiled via `npm run build-types`), Express API, Playwright (unit/api/e2e projects).

**Spec:** `docs/superpowers/specs/2026-10-16-autonomous-agent-admin-ui-design.md`

## Global Constraints

- **No data migration.** Autonomous agents are unreleased (last tag v0.12.1). Change the schema directly and add no `upgrade/` script.
- Say "autonomous agent", never bare "agent", in new identifiers, test names and docs.
- **Approval levels:**
  - values `write` | `destructive` | `none`, default `destructive`;
  - readOnly is always `allow`;
  - a tool with no annotation counts as a write.
- **Approval copy:**
  - label: fr "Demander une approbation pour" / en "Ask for approval for";
  - choices (fr): "Toutes les opérations qui effectuent des modifications" / "Uniquement les opérations notées comme particulièrement destructives" / "Aucune (l'agent est entièrement autonome dans ses appels d'outils)";
  - choices (en): "Every operation that makes changes" / "Only operations marked as particularly destructive" / "None (the agent is fully autonomous in its tool calls)".
- **Role:** default `user`, whatever example is chosen. Offer only the organization's real roles (simple-directory `GET /api/organizations/:id/roles`).
- **NHI name** is `"<title> (autonomous agent)"`, as `autonomousAgentNhiBody` already builds it.
- **Divergence** between the stored role or title and the simple-directory NHI is accepted when simple-directory refuses a write (file storage). The UI must say so, never fail silently.
- After changing `api/types/**/schema.js` or `api/doc/**/schema.js`, run `npm run build-types`.
  - Adding a property before regenerating crashes the running dev-api, so regenerate right away.
  - `build-types` never prunes `ui/components.d.ts`. Remove stale `Vjsf*` entries by hand.
- **One stateful test run at a time.** Never launch two api/e2e runs concurrently.
- Dev simple-directory is file-storage: NHI create/patch/delete **fail locally**. Locally, e2e tests can only cover the failure paths, plus the success paths stubbed with `page.route`.
- Quality gates per task: `npm run lint-fix`, `npm run check-types`, plus the task's tests. Before the e2e of tasks 4–7, run `cd lib-vuetify && npm run build && cd ../lib-vue && npm run build`.

## Review Focus

1. **Toggling Activé in the header while the configuration has unsaved edits.** The edits survive, and a later Save does not revert the toggle. Test: Task 7, step 1, "header toggle keeps unsaved edits".
2. **Renaming an agent, or changing its role, when simple-directory refuses the PATCH** (dev = file storage). The agent is saved, and a persistent warning names what did not reach the directory. Test: Task 5, step 1, "identity sync failure is reported".
3. **Creation succeeds but enrolment fails.** The admin lands on the agent page, the created agent is not lost, and a "Créer l'identité" retry is offered. Test: Task 4, step 1, "creation without directory lands on the page with a retry".
4. **Picking an example on the Rôle tab after hand-editing the persona.** A confirmation is asked, and the approval level is untouched. Test: Task 3 unit `isPristineText`, and Task 5, step 1, "example picker confirms over edits".
5. **A notification deep link `?tab=history&run=<id>` or `?tab=tasks`** still opens the right Activité tab and run. Test: Task 7, step 1, "activity deep links".

---

### Task 1: One approval level, end to end

**Files:**
- Modify: `shared/approval-policy.ts`
- Modify: `api/src/conversations/approval-policy.ts`
- Modify: `api/src/conversations/executor.ts:203`
- Modify: `api/src/self-knowledge/operations.ts:12,38,54-97`
- Modify: `api/src/self-knowledge/tools.ts:59`
- Modify: `api/types/autonomous-agent/schema.js` (replace `approvals` with `approvalLevel`)
- Modify: `api/doc/autonomous-agents/autonomous-agent-write-req/schema.js` (pick list and JSDoc union)
- Modify: `ui/src/utils/autonomous-agent-draft.ts:27`
- Modify: `ui/src/components/AutonomousAgentForm.vue:37,47,66-69` (temporary: the form is replaced in Task 5)
- Modify: `docs/architecture/autonomous-agents.md:329-380`
- Modify: `docs/architecture/planned-tasks.md:139`
- Test files to update:
  - `tests/features/autonomous-agents/approval-gate.api.spec.ts`
  - `tests/features/autonomous-agents/approval-gate.e2e.spec.ts`
  - `tests/features/autonomous-agents/agent-page.e2e.spec.ts:43`
  - `tests/features/autonomous-agents/edit-draft.unit.spec.ts:70`
  - `tests/features/autonomous-agents/runtime.api.spec.ts:571`
  - `tests/features/code-mode/code-mode.api.spec.ts:56`
  - `tests/features/files/file-approval.api.spec.ts:30`
  - `tests/features/files/file-approval.e2e.spec.ts:22`
  - `tests/features/self-knowledge/planning.api.spec.ts:172`
  - `tests/features/self-knowledge/self-knowledge.unit.spec.ts:19`
  - `tests/features/web/web-access.e2e.spec.ts:35`
  - plus a new `tests/features/autonomous-agents/approval-level.unit.spec.ts`

**Interfaces:**
- Produces, in `shared/approval-policy.ts`:
  - `type ApprovalLevel = 'write' | 'destructive' | 'none'`
  - `const APPROVAL_LEVELS: ApprovalLevel[]`
  - `const DEFAULT_APPROVAL_LEVEL: ApprovalLevel = 'destructive'`
  - `type ApprovalClass = 'readOnly' | 'write' | 'destructive'` (unchanged)
  - `type ApprovalPolicy = 'allow' | 'approve'`
  - `approvalPolicyFor(cls: ApprovalClass, level?: ApprovalLevel): ApprovalPolicy`. An undefined level means the default.
- Removes: `DEFAULT_APPROVALS`, `Approvals`, `resolveApproval`, and the `'deny'` policy.
- `applyApprovalPolicy(tools: ToolSet, level?: ApprovalLevel): ToolSet`.
- `personalAssistantTools` calls it with `'write'`.
- Schema property `approvalLevel`:
  - `{ type: 'string', default: 'destructive', layout: 'radio', oneOf: [{const, title, x-i18n-title}…] }`, with the copy from Global Constraints;
  - `title` / `x-i18n-title` = the label;
  - `description` (fr/en): "Une tâche planifiée n'a personne pour approuver : les outils soumis à approbation ne lui sont pas proposés." / "A planned task has nobody to approve: tools that need approval are not offered to it."

- [ ] **Step 1: Write `approval-level.unit.spec.ts`**

Name it `test.describe('approvalPolicyFor')` and assert the full table:
- `write` → readOnly `allow`, write `approve`, destructive `approve`
- `destructive` → `allow`, `allow`, `approve`
- `none` → `allow`, `allow`, `allow`
- `undefined` → same as `destructive`

Add `test('applyApprovalPolicy never removes a tool')`: with level `write`, a tool set with one tool of each class keeps all 3 keys, and only the readOnly one has no `needsApproval`.

- [ ] **Step 2: Run it and check that it fails**

Run: `npm run test tests/features/autonomous-agents/approval-level.unit.spec.ts`
Expected: FAIL (`approvalPolicyFor` is not exported).

- [ ] **Step 3: Implement the shared and server functions above**

Update their callers:
- **executor:** `autonomousAgent.approvalLevel`.
- **self-knowledge:**
  - `agent.approvalLevel`;
  - `toolStatus` loses the deny branch;
  - the policy bullets become one line, `approval level: <level>` followed by the three class results;
  - the `get_my_configuration` payload carries `approvalLevel` in place of `approvals`.

Update the comment above `applyApprovalPolicy` too: there is no `deny` any more.

- [ ] **Step 4: Schema change, then regenerate**

Replace the `approvals` property in both schemas, then run `npm run build-types`.

Then update the UI:
- `autonomousAgentEditDraft` sets `draft.approvalLevel = autonomousAgent.approvalLevel ?? DEFAULT_APPROVAL_LEVEL`.
- In `AutonomousAgentForm.vue`, the web risk is shown when `web.enabled && (approvalLevel ?? DEFAULT_APPROVAL_LEVEL) !== 'write'`.
- The `webRisk` copy ends with: "…ou réglez l'approbation sur « Toutes les opérations qui effectuent des modifications »." / "…or set approval to \"Every operation that makes changes\"."

- [ ] **Step 5: Update the test fixtures**

Mapping from the old `approvals` objects:

| old | new |
|---|---|
| `{destructive:'allow'}` | `approvalLevel: 'none'` |
| `{write:'approve'}` | `'write'` |
| `{readOnly:'allow',write:'approve',destructive:'deny'}` | `'write'` |
| all-`allow` | `'none'` |
| the default triple | drop the field |

Some tests only existed for deny or for gated reads:
- **Delete** the cases at `approval-gate.api.spec.ts:66`, `:91`, `:202` and `:387`. Those behaviours no longer exist.
- **Keep the scenario** of `:387` if it is really about something else (read it first), using `'write'`.

Add one api case, `test('an approvals object is refused')`: a PUT with `approvals: {}` returns 400 (`additionalProperties: false`).

In `self-knowledge.unit.spec.ts`, use `approvalLevel: 'write'` and update the expected text.

For the e2e assertions that relied on `deny` hiding a tool (`agent-page.e2e.spec.ts`, `web-access.e2e.spec.ts`), assert the approval card instead.

- [ ] **Step 6: Run the touched specs**

Run each touched spec, one stateful run at a time:

`npm run test tests/features/autonomous-agents tests/features/self-knowledge tests/features/files tests/features/code-mode tests/features/web`

Expected: all pass.

- [ ] **Step 7: Docs**

Rewrite the approval section of `autonomous-agents.md`:
- the level table;
- the personal assistant is `write` plus reads-only when anonymous;
- remove every `deny` paragraph, including "deny removes rather than refuses";
- in the "approved call whose tool is gone" sentence, drop "its class set to deny".

In `planned-tasks.md:139`, the status "denied by policy" goes away.

- [ ] **Step 8: Commit** with `refactor: one approval level for autonomous agents`.

---

### Task 2: Stored role and identity sync helpers

**Files:**
- Modify: `api/types/autonomous-agent/schema.js` (add `role`)
- Modify: `api/doc/autonomous-agents/autonomous-agent-write-req/schema.js` (pick `role`)
- Modify: `shared/autonomous-agent-identity.ts`
- Modify: `ui/src/composables/use-autonomous-agent-enrolment.ts`
- Test: `tests/features/autonomous-agents/enrolment.unit.spec.ts`

**Interfaces:**
- Schema `role`:
  - `{ type: 'string', default: 'user', title: 'Role in the organization', 'x-i18n-title': { en, fr: "Rôle dans l'organisation" } }`;
  - `description` fr/en: "Ce que l'agent peut faire dans les services de la plateforme, comme un membre ayant ce rôle." / "What the agent can do in the platform's services, like a member with this role.";
  - `layout.getItems`:
    - `url: '/simple-directory/api/organizations/${context.owner.id}/roles'` (it is root-absolute, and the form's `fetch` rewrites it with `rewriteSimpleDirectoryUrl`);
    - the response is a string array, so items are the strings themselves.
- In `shared/autonomous-agent-identity.ts`:
  - `autonomousAgentNhiName(title: string): string` returns `` `${title} (autonomous agent)` ``. `autonomousAgentNhiBody` uses it.
  - `identityPatch(saved: { title?: string, role?: string }, next: { title?: string, role?: string }): { name?: string, role?: string } | null`. It returns the changed fields only, and `null` when nothing changed. Treat an undefined role as `'user'`.
- `useAutonomousAgentEnrolment` returns:
  - `{ enrolling, error, enrol, readIssuer, syncIdentity, removeIdentity }`;
  - `enrol(agent: { id: string, title: string, role?: string }): Promise<void>`. The role is read from the agent, not passed separately.
  - `syncIdentity(clientId: string, patch: { name?: string, role?: string }): Promise<void>`. It PATCHes `${nhisUrl}/${clientId}`.
  - `removeIdentity(clientId: string): Promise<void>`. It DELETEs `${nhisUrl}/${clientId}`.
  - Both throw, and the caller formats the error with `enrolmentErrorMessage`.
- Removed: `listNhis`, the `OrgNhi` export, and the public use of `attach` (keep it internal to `enrol`).

- [ ] **Step 1: Failing unit tests in `enrolment.unit.spec.ts`**

- `identityPatch({title:'A',role:'user'},{title:'A',role:'user'})` is `null`.
- A title change gives `{ name: 'B (autonomous agent)' }`.
- A role change gives `{ role: 'admin' }`.
- `identityPatch({title:'A'},{title:'A',role:'user'})` is `null` (undefined role counts as `user`).
- `autonomousAgentNhiBody({…, role: undefined}).name === autonomousAgentNhiName(title)`.

- [ ] **Step 2: Run them**

Run: `npm run test tests/features/autonomous-agents/enrolment.unit.spec.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

Add the schema field, then run `npm run build-types`. Add the shared helpers and the composable changes.

`AgentConfigurationTab.vue` still calls `listNhis` and `attach`. Remove its reuse select and make its confirm call `enrol(props.agent)` directly. That component is replaced in Task 5, so keep the change minimal: only enough to compile.

- [ ] **Step 4: Check**

Run the unit spec, then `npm run check-types`. Expected: PASS.

- [ ] **Step 5: Commit** with `feat: store the autonomous agent's organization role and sync helpers for its NHI`.

---

### Task 3: Starting examples

**Files:**
- Create: `ui/src/utils/autonomous-agent-examples.ts`
- Test: `tests/features/autonomous-agents/examples.unit.spec.ts`

**Interfaces:**
- `type AutonomousAgentExampleKey = 'blank' | 'publication' | 'quality'`
- `const AUTONOMOUS_AGENT_EXAMPLE_KEYS: AutonomousAgentExampleKey[]`, ordered publication, quality, blank.
- `exampleFields(key, locale: 'fr' | 'en', title: string): { persona: string, instructions: string, approvalLevel: ApprovalLevel }`
  - `publication` → `approvalLevel: 'destructive'`
  - `quality` → `'write'`
  - `blank` → `DEFAULT_APPROVAL_LEVEL`
  - Only `blank` interpolates the title. Its persona is fr « Tu es « {title} », un agent autonome de cette organisation. Réponds avec précision et dis-le quand tu ne sais pas. » (en equivalent), and its instructions are `''`.
- `isPristineText(persona: string | undefined, instructions: string | undefined, locale, title): boolean`. It is true when both are empty, or when they equal some example's fields exactly, so that replacing them loses nothing.
- **Copy guidance**, in fr and en. Persona: 2–4 sentences. Instructions: a short bulleted procedure.
  - **publication:** prepares and publishes datasets. It checks title, description, licence, keywords and update frequency before publishing, asks when a required piece of information is missing, and summarises what it changed.
  - **quality:** monitors datasets for missing values, stale updates, schema breaks and inconsistent formats. It reports findings with the dataset and the column, suggests fixes, and changes nothing unless explicitly asked.

- [ ] **Step 1: Failing unit tests**

- Every key and locale gives a non-empty persona.
- The `approvalLevel` values match the mapping above.
- `isPristineText` is true on `('', '')`, true on an example's exact fields, and false after one character is appended.
- The blank persona contains the title.

- [ ] **Step 2: Run them.** Expected: FAIL.

- [ ] **Step 3: Implement.** Expected: the unit spec passes.

- [ ] **Step 4: Commit** with `feat: starting examples for autonomous agents`.

---

### Task 4: Creation dialog that also creates the identity

**Files:**
- Create: `ui/src/components/AutonomousAgentCreateDialog.vue`
- Modify: `ui/src/components/AutonomousAgentsSection.vue` (replace the inline dialog and its form)
- Test: `tests/features/autonomous-agents/autonomous-agents.e2e.spec.ts`

**Interfaces:**
- Consumes:
  - `exampleFields` (Task 3);
  - `useAutonomousAgentEnrolment().enrol` (Task 2);
  - simple-directory `GET ${$sdUrl}/api/organizations/${accountId}/roles` through `ofetch` (not `$fetch`; see the comment in `use-autonomous-agent-enrolment.ts`).
- Props: `{ accountType: string, accountId: string }`, plus `v-model` for open.

**Behaviour:**
- Fields:
  - **Nom**: `v-text-field`, required.
  - **Rôle dans l'organisation**: `v-select` of the roles, default `user`, with the hint copy from Task 2.
  - **Partir d'un exemple**: `v-btn-toggle` mandatory, default `blank`.
- **Créer:**
  1. POST `{ title, role, ...exampleFields(key, locale, title), mcpServers: [], enabled: true }`.
  2. Run `enrol(created)`. If it throws, `sendUiNotif` a warning with `enrolmentErrorMessage`.
  3. Always `router.push` to the agent page.
- If the roles fetch fails, the select falls back to `['admin', 'user']`.

Test ids: `autonomous-agent-create-title`, `-role`, `-example-<key>`, `autonomous-agent-save`.

- [ ] **Step 1: Rewrite the creation e2e tests**

`test('creation asks only for a name, a role and an example')`:
- open the dialog;
- check that there are only these three fields (no persona textarea, no MCP servers, no client id);
- pick `quality`, then Créer.

`test('creation without directory lands on the page with a retry')`:
- In dev, enrolment fails.
- Expect the URL `/organization/test1/agents/<id>`, and a visible enrol-retry button (`autonomous-agent-enrol`, Task 5).
- Through the API, the agent has `role: 'user'`, `approvalLevel: 'write'`, and a persona equal to the fr quality example.

`test('creation enrols the identity when the directory accepts it')`:
- `page.route` stubs the simple-directory POST `**/simple-directory/api/organizations/*/nhis` to answer `201 { id: 'nhi-stub' }`.
- Also stub the agent PUT: the real one performs an exchange that would fail. Do it with `route.fulfill` of the merged agent.
- Expect the POST body `role: 'user'`, and the name ending in ` (autonomous agent)`.

Delete the old "offers to enrol … reuse" assertions.

- [ ] **Step 2: Run them**

Run: `npm run test tests/features/autonomous-agents/autonomous-agents.e2e.spec.ts`
Expected: FAIL.

- [ ] **Step 3: Implement** the dialog, and wire it into `AutonomousAgentsSection.vue`.

- [ ] **Step 4: Run the spec again.** Expected: PASS. The retry-button test passes only after Task 5, so mark it `test.fixme` until then and un-fixme it in Task 5.

- [ ] **Step 5: Commit** with `feat: create an autonomous agent from a name, a role and an example`.

---

### Task 5: Configuration block with tabs (Rôle, Outils, Sécurité)

**Files:**
- Create: `api/doc/autonomous-agents/autonomous-agent-form-part.js`, following `api/doc/settings/org-form-part.js`. Its `$id` is `https://github.com/data-fair/agents/autonomous-agent/form-${name}`, it slices `AutonomousAgentSchema.properties` (from `api/types/autonomous-agent/schema.js`), and it keeps `'x-vjsf': { xI18n: true, pluginsImports: ['@koumoul/vjsf-markdown'] }`.
- Create: one `schema.js` per slice:
  - `api/doc/autonomous-agents/autonomous-agent-form-role/schema.js`: `['title', 'persona', 'instructions']`
  - `.../autonomous-agent-form-tools/schema.js`: `['mcpServers', 'externalMcpServers', 'web']`
  - `.../autonomous-agent-form-security/schema.js`: `['approvalLevel', 'instructors', 'role']`
  - `.../autonomous-agent-form-memory/schema.js`: `['memory']`
- Modify: `api/doc/autonomous-agents/autonomous-agent-write-req/schema.js`: `'x-exports': ['validate', 'types']` (it no longer exports vjsf). Delete the three generated `ui/src/components/vjsf/vjsf-autonomous-agent-write-req*.vue`, and their `ui/components.d.ts` entries.
- Create: `ui/src/components/agent-page/AgentConfiguration.vue`. It replaces `AgentConfigurationTab.vue` and `AutonomousAgentForm.vue`, which you then delete.
- Modify: `ui/src/pages/[type]/[id]/agents/[agentId].vue`, so the page renders `AgentConfiguration` in place of the configuration tab. The full restructure happens in Task 7.
- Tests:
  - `tests/features/autonomous-agents/agent-page.e2e.spec.ts`
  - `tests/features/autonomous-agents/approval-gate.e2e.spec.ts`
  - `tests/features/web/web-access.e2e.spec.ts`
  - `tests/features/autonomous-agents/edit-draft.unit.spec.ts`

**Interfaces:**
- Consumes:
  - `identityPatch`, `syncIdentity`, `enrol` (Task 2);
  - `exampleFields`, `isPristineText`, `AUTONOMOUS_AGENT_EXAMPLE_KEYS` (Task 3);
  - `autonomousAgentEditDraft`, `pruneHiddenSelections`.
- `AgentConfiguration.vue`:
  - props `{ agent: any, accountType: string, accountId: string }`;
  - emits `changed`;
  - exposes `hasDiff: ComputedRef<boolean>`, which Task 7 needs.
- Structure:
  - a `df-section-tabs` with title "Configuration";
  - `#actions` holds `form-actions` (Save/Cancel, as in `OrgConfigSection.vue`), and, when the agent has no `nhi.clientId`, the warning button `autonomous-agent-enrol` "Créer l'identité" / "Create the identity" placed before it. It is disabled while `hasDiff`, with the existing `saveFirst` hint, and calls `enrol(agent)` directly, with no dialog. Its error shows in `autonomous-agent-enrol-error`.
  - tab keys `role`, `tools`, `security`, `memory`, each a `v-tabs-window-item eager` with its own `v-form` (the validity of every tab gates Save, as in the settings page);
  - the tab state is in the query `config=<key>`, default `role`. It is separate from Task 7's `tab`.
- The vjsf options and context, the `mcp-profiles` slot and the `pruneHiddenSelections` watch move here unchanged from `AutonomousAgentForm.vue`, on the tools slice. The web-risk alert renders in the tools tab and reads `approvalLevel` from the shared draft.
- Rôle tab:
  - above its form, a `v-select` "Partir d'un exemple" (test id `autonomous-agent-example`), with no value kept.
  - On pick: if `isPristineText(...)` is true, replace persona and instructions. Otherwise, open a confirm dialog first (`autonomous-agent-example-confirm`).
  - It never sets `approvalLevel`.
- Save:
  1. PUT the draft.
  2. If `saved.nhi?.clientId` and `identityPatch(saved, draft)` is non-null, call `syncIdentity`.
  3. On failure, keep a persistent `v-alert` warning (`autonomous-agent-identity-sync-error`). fr: « L'agent est enregistré, mais l'annuaire n'a pas accepté le nouveau {nom|rôle} : {message}. L'identité garde l'ancienne valeur. » Write an en equivalent. The alert stays until the next successful sync or a reload.
  4. Emit `changed`.
- The Mémoire tab in this task holds only the memory slice form. Task 6 adds the panel.

- [ ] **Step 1: e2e tests in `agent-page.e2e.spec.ts`**

`test('configuration is split in tabs with save in the bar')`:
- The tabs Rôle/Outils/Sécurité/Mémoire are visible.
- Edit the persona, and the Save button is enabled in the section bar.
- Switch to Sécurité, pick "Toutes les opérations qui effectuent des modifications", Save.
- The API returns `approvalLevel: 'write'`.
- No "Activé" checkbox appears anywhere in the form.

`test('example picker confirms over edits')`:
- Type into the persona, then pick Publication.
- A confirm appears. Confirm it.
- The persona equals the fr publication example, and `approvalLevel` is unchanged after Save.

`test('identity sync failure is reported')`:
- Create an agent through the API with `nhi.clientId` (reuse how `autonomous-agents.e2e.spec.ts:80-96` seeds an enrolled agent).
- Rename it and Save.
- The dev directory refuses the PATCH, so `autonomous-agent-identity-sync-error` is visible and contains the new name's field, and the API shows the new title.

Un-fixme Task 4's retry test.

Update `approval-gate.e2e` and `web-access.e2e` to the new tab locations: approval level in Sécurité, web in Outils.

- [ ] **Step 2: Run them.** Expected: FAIL.

- [ ] **Step 3: Implement**

1. Write the slice schemas, then run `npm run build-types` and prune `components.d.ts`.
2. Write `AgentConfiguration.vue`.
3. Delete `AgentConfigurationTab.vue` and `AutonomousAgentForm.vue`.

`autonomous-agent-draft.ts` still imports the write-req schema for `AUTONOMOUS_AGENT_WRITABLE_KEYS`. Keep that. Add `role: autonomousAgent.role ?? 'user'` to the materialized defaults, and the matching case to `edit-draft.unit.spec.ts`.

- [ ] **Step 4: Run** `npm run test tests/features/autonomous-agents tests/features/web`, the e2e and unit projects. Expected: PASS.

- [ ] **Step 5: Commit** with `feat: autonomous agent configuration in tabs, with identity sync on save`.

---

### Task 6: Memory inline in the Mémoire tab

**Files:**
- Create: `ui/src/components/AgentMemoryPanel.vue`. It holds the body of `AgentMemoryDialog.vue`: the documents/history tabs, the editor and the restore controls, keeping every existing `memory-*` test id.
- Modify: `ui/src/components/AgentMemoryDialog.vue`. It becomes a `v-dialog` wrapping `AgentMemoryPanel`, still used by `AgentChat.vue`.
- Modify: `ui/src/components/agent-page/AgentConfiguration.vue`. The memory tab renders the memory slice form, then `AgentMemoryPanel`.
- Test: `tests/features/memory/memory.e2e.spec.ts`

**Interfaces:** `AgentMemoryPanel` props are `{ agent: any, accountType: string, accountId: string, canConfigure: boolean }`. Copy them from the dialog's current props, minus `modelValue`.

- [ ] **Step 1:** In `memory.e2e.spec.ts`, replace `getByTestId('autonomous-agent-memory').click()` with clicking the Mémoire configuration tab. Give that tab the test id `autonomous-agent-config-tab-memory`. Keep every other step.
- [ ] **Step 2: Run it.** Expected: FAIL.
- [ ] **Step 3: Implement the extraction.** The memory panel saves on its own (versioned store). It is not part of the configuration draft and does not touch `hasDiff`.
- [ ] **Step 4: Run** `tests/features/memory/memory.e2e.spec.ts` and the chat memory e2e cases in it. Expected: PASS.
- [ ] **Step 5: Commit** with `feat: autonomous agent memory inline in its configuration`.

---

### Task 7: Page header and Activité block

**Files:**
- Modify: `ui/src/pages/[type]/[id]/agents/[agentId].vue`
- Tests:
  - `tests/features/autonomous-agents/agent-page.e2e.spec.ts`
  - `tests/features/tasks/tasks.e2e.spec.ts`
  - `tests/features/tasks/history.e2e.spec.ts`

**Interfaces:**
- Consumes: `AgentConfiguration` (`hasDiff` exposed), `AgentTasksTab`, `AgentHistoryTab`, and `removeIdentity` (Task 2).

**Layout:**
- **Header row:**
  - the title (`text-h5`);
  - `AutonomousAgentStateChips`;
  - the spacer;
  - a `v-switch` "Activé" (`autonomous-agent-enabled`, `hide-details`, inline);
  - "Ouvrir la conversation";
  - a `v-menu` with "Supprimer" (`autonomous-agent-delete`).
- The **Configuration** block (Task 5).
- The **Activité** block: a `df-section-tabs` titled "Activité" with the tabs `tasks` and `history`. These keep the query key `tab` and the existing `run` handling, so the notification URLs built in `api/src/tasks/operations.ts` do not change. Default `tasks`.

**Behaviour:**
- **Enabled switch:**
  1. PUT `{ ...autonomousAgentEditDraft(agent), enabled: next }`. This uses the stored agent, never the configuration draft.
  2. Then refresh the agent.
  3. `AgentConfiguration`'s reset-on-agent-change must not drop unsaved edits. When `hasDiff`, it sets `saved` to the new edit draft and only copies `enabled` into `draft`. Otherwise it resets both, as today.
- **Delete:**
  1. A confirm dialog: « Supprimer l'agent, ses conversations, ses tâches et son identité ? ».
  2. If `nhi.clientId`, call `removeIdentity`. On failure, show a warning notif with `enrolmentErrorMessage` and continue.
  3. DELETE the agent.
  4. `router.push` to `/${accountType}/${accountId}`.
- The breadcrumbs and the admin redirect stay unchanged.

- [ ] **Step 1: e2e tests in `agent-page.e2e.spec.ts`**

`test('header toggle keeps unsaved edits')`:
- Edit the persona without saving.
- Toggle Activé off. The API shows `enabled: false`.
- The persona edit is still in the field.
- Save. The API shows the new persona and still `enabled: false`.

`test('activity deep links')`:
- `?tab=history&run=<runId>`, seeded the way `tests/features/tasks/history.e2e.spec.ts` seeds a run, opens Historique with that run shown.
- `?tab=tasks` opens Tâches planifiées.

`test('deleting an autonomous agent')`:
- Confirm the deletion.
- Land on the account page. The API GET returns 404.
- With a seeded `nhi.clientId`, the directory DELETE fails in dev, a warning notif shows, and the agent is still deleted.

In the tasks and history e2e specs, update any locator of the old top-level tabs.

- [ ] **Step 2: Run them.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** the `autonomous-agents`, `tasks`, `memory` and `review` e2e folders, in one run. Expected: PASS.
- [ ] **Step 5: Commit** with `feat: autonomous agent page with a header, configuration and activity blocks`.

---

### Task 8: Docs and full checks

**Files:**
- Modify: `docs/architecture/autonomous-agents.md:182-187`. Enrolment now happens at creation, from the role chosen there. The name and role are synced on save, and the NHI is deleted with the agent, all client-side. Divergence is accepted when the directory refuses, and the UI reports it. The "reuse an existing identity" path is gone.
- Modify: `docs/architecture/configuration.md:208-216`. Steps 4–5 become "done by the creation dialog". Keep the manual steps as the fallback when enrolment fails, and the `MANAGE_NHIS` note.

- [ ] **Step 1:** `grep -rn "approvals\b\|'deny'\|listNhis\|AutonomousAgentForm\|AgentConfigurationTab\|write-req-en" api ui shared lib-vue docs tests simulations --include=*.ts --include=*.vue --include=*.md --include=*.js` should show only legitimate hits: the tool-approval mechanism (`approvals.ts`, approval parts), not the removed config.
- [ ] **Step 2:** Run `npm run lint-fix`, then `npm run check-types`, then `npm run test` (the whole suite, once), then `docker build -t agents .`. Expected: all green. Report any failure with its output.
- [ ] **Step 3: Commit** with `docs: autonomous agent creation, identity sync and approval level`.
