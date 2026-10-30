# Autonomous agent admin UI: simpler creation, structured page, one approval level

Date: 2026-10-16 · Branch: `feat-autonomous-agents` (unreleased: last tag v0.12.1 has no autonomous agents)

## Why

Alban reviewed the autonomous agent creation and configuration UI and found it confusing:

- **Approvals** are three selects (Lecture / Écriture / Destruction × Autoriser / Approuver chaque appel /
  Ne jamais proposer). That makes nine combinations, most of them meaningless (for example "approve
  writes, allow destruction"). An admin thinks of approval as **one level on a scale**.
- **"Accès au web"** ends with an "Activé" checkbox whose effect is unclear. It is actually the
  agent-wide `enabled` kill switch, rendered last by vjsf right after the web section, so it reads as
  part of that section.
- **Persona** is an empty textarea, and writing a system prompt from scratch is hard.
- **Structure.** The page is one long vjsf form, with the enrolment and memory buttons scattered above
  it. Creation shows that whole form in a dialog, and enrolling the NHI is a separate second step that
  shows ids and offers to "reuse an existing identity". The admin should never have to deal with an
  NHI id.

The jobs these agents are created for are **data publication** and **data-quality monitoring**.

## Goals

1. Creation asks only for what defines the agent's identity: **name** and **role in the organization**
   (the simple-directory role of its NHI: admin / contrib / user, which decides what it can do in
   data-fair). Optionally a starting example. One click creates the agent **and** its NHI, then opens
   the agent page.
2. The agent page has two blocks:
   - **Configuration**: tabs, with the Save/Cancel actions in the block's top bar, right-aligned.
   - **Activité**: the existing planned tasks and history, as tabs.
3. Approvals become **one level** with three choices.
4. Persona and instructions start pre-filled, and examples are offered for the two target jobs.
5. The enabled/disabled state is visibly the agent's on/off state, separate from the form.

## Non-goals and anti-goals

- No template management (no stored templates, no settings page for them). The examples are UI text.
- No new way to restrict tools. Restriction stays where it already is: MCP server selection, profiles
  and the tool filter.
- Don't make NHI ids or the issuer visible in the normal flow. An admin who never opens simple-directory
  should never see the word "client id".
- No change to how approvals are enforced at run time beyond mapping the new level onto the existing
  classes (see below). The run-time behaviour stays the same: a scheduled task is never offered a
  gated tool.

## Decisions taken with Alban

### Approval level

One field, labelled "Demander une approbation pour" / "Ask for approval for", shown as radio buttons:

| value | fr | en | mapping onto today's classes |
|---|---|---|---|
| `write` | Toutes les opérations qui effectuent des modifications | Every operation that makes changes | readOnly allow · write approve · destructive approve |
| `destructive` (default) | Uniquement les opérations notées comme particulièrement destructives | Only operations marked as particularly destructive | readOnly allow · write allow · destructive approve |
| `none` | Aucune (l'agent est entièrement autonome dans ses appels d'outils) | None (the agent is fully autonomous in its tool calls) | everything allow |

- Reading never requires approval.
- The `deny` ("Ne jamais proposer") option disappears.
- A tool that declares nothing still counts as a write.
- The default is `destructive`, which equals today's `DEFAULT_APPROVALS`.
- A short note under the choice says that a scheduled task has nobody to approve, so it is never
  offered a gated tool. With `write` this means a task can only read.
- The web-access risk warning (`AutonomousAgentForm.vue`) now shows when web access is on and the
  level is not `write`.

### Creation dialog

Fields:
- **Nom** (required).
- **Rôle dans l'organisation**: a select of the organization's simple-directory roles, default `user`, with a one-line hint ("what the
  agent can do in data-fair, like a member with this role").
- **Partir d'un exemple**: a choice between Publication de données / Suivi de qualité / Vierge.

"Créer" saves the agent, then runs the existing client-side enrolment (`useAutonomousAgentEnrolment().enrol(agent, role)`)
in the same action, then navigates to the agent page.

Today's "reuse an existing identity" option is dropped from the UI. Alban did not object when told.

### The NHI is managed entirely from the agent's UI

Alban: switching between the simple-directory UI and this one is not clear enough. The only simple
scenario is that the agent page manages its identity entirely.

- **Role default: `user`** (least privilege), at creation, whatever example is chosen. Examples do not
  pick a role.
- The role select offers the organization's real roles, so `contrib` is not offered on an organization
  that does not have it.
- The role is **stored on the autonomous agent** (a new schema field) and is **editable on the Sécurité
  tab**. Saving a role change also updates the NHI's role in simple-directory.
- **Divergence is accepted.** When simple-directory cannot be written (read-only / file storage), the
  agent's stored role may differ from the real one. The real value then lives in simple-directory, and
  the UI says so instead of failing silently.
- Updating the role of an existing NHI may need an endpoint in simple-directory that does not exist
  yet (only `POST /api/organizations/:id/nhis` is known to be used). Check that first. Adding it there
  is in scope: it is exactly the kind of stack integration this project is custom for. The edit path
  will only be fully tested after a staging deployment; locally, cover what the dev simple-directory
  supports.
- *My call, following "entirely":* renaming the agent renames its NHI. Deleting the agent deletes its
  NHI, best effort, with the failure reported and not blocking the deletion.

### Persona examples

Two examples, written in the UI locale (fr/en), for **Publication de données** and **Suivi de qualité
des données**:
- Each fills **persona and instructions**, and sets the **approval level**. Publication uses
  `destructive`. Quality monitoring uses `write`, because it reports and does not change data unless
  asked.
- A new agent starts from the chosen example. "Vierge" gives a short neutral persona, never an empty
  field.
- On the page, the Rôle tab has a "Partir d'un exemple" picker that replaces **only** the persona and
  instructions. It never touches the approval level, so another tab is never loosened behind the
  admin's back (my call). If the text was edited since, it asks for confirmation first.

### Page structure (mockup validated)

- **Header**: title, state chips, an **Activé / Désactivé switch** that saves immediately on its own
  (not part of the form diff), and "Ouvrir la conversation".
- **Configuration** block with tabs and `Annuler` / `Enregistrer` in its tab bar:
  - **Rôle**: persona, instructions, example picker.
  - **Outils**: MCP servers (with profiles / tool filter), external MCP servers, web access (switch +
    allowed URLs, with its warning next to it).
  - **Sécurité**: approval level, who may instruct, role in the organization.
  - **Mémoire**: memory switch, and the read/edit/restore view that is a dialog today
    (`AgentMemoryDialog`), now inline.
- **Activité** block with tabs **Tâches planifiées** / **Historique**: the current `AgentTasksTab` and
  `AgentHistoryTab`, unchanged inside.
- The `?tab=tasks` / `?tab=history&run=…` deep links used by notification URLs
  (`api/src/tasks/operations.ts`, `docs/architecture/planned-tasks.md`) must keep working: they now
  select the Activité tab.

## Constraints

- **No data migration.** Autonomous agents are not in any release (v0.12.1), so the schema changes
  directly (see the upgrade-scripts convention: only data a release stored is migrated). Dev databases
  are disposable.
- Types come from `api/types/autonomous-agent/schema.js` → `npm run build-types`. The vjsf form is
  generated from it. A config property added before regenerating crashes the running dev-api.
- Say "autonomous agent", never bare "agent", in code identifiers and docs.
- Configuration stays org-admin-owned. The superadmin gate stays as it is.
- Keep `docs/architecture/autonomous-agents.md` (and `configuration.md`'s enrolment steps) in line with
  the new flow.
- Quality checks: `npm run lint-fix`, `npm run check-types`, tests (unit/api/e2e) updated, docker build.

## Left to the builder

- The schema shape of the level (a top-level enum versus keeping an `approvals` object), and how the
  server's `approval-policy` maps it. There must be one mapping, in `shared/approval-policy.ts`, used
  by both the server and the form.
- How the form is split across tabs: several vjsf instances on sub-schemas, or one vjsf with a tabs
  layout. Either way there is one draft, one diff and one Save.
- Exact wording of the two examples and the neutral default, in fr and en.
- What happens when creation succeeds but enrolment fails. The agent exists without an identity: land
  on its page with the existing enrolment error shown and a retry action, rather than losing the
  created agent.
- Whether the server keeps accepting `deny` anywhere internally (for example service tools or web
  tools that read the approvals). Remove what only the UI used.
