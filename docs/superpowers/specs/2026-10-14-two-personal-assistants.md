# Two personal assistants, each with its own servers

Status: agreed 2026-10-14 (owner decisions: deployment config, two ids, chosen by the client).

## Problem

The one built-in personal assistant (`personal`) took the deployment's WHOLE MCP catalog
(`config.mcpServers`), the list configured agents pick from. The intended set-up gives the assistant only
data-fair's MCP with `?profile=catalog` (reads only), but the catalog is shared: once an operator adds
`?profile=write_datasets` for autonomous agents, every personal assistant gets those tools too. Choosing tools
for autonomous agents silently widened the personal assistant.

## Decisions

- **Two standard assistants**, fixed ids, synthetic as before (no collection, built per call):
  `portal-assistant` (front office) and `back-office-assistant`. They differ by their servers (and title); both
  act as the person through their forwarded session, have no NHI, no memory, no files, no web access.
- **Their servers are deployment configuration**, the same for every organization:
  `personalAssistants: { portal: { mcpServers: [...] }, backOffice: { mcpServers: [...] } }`, each entry a
  reference like a configured agent's (`serverId`, optional `toolFilter`). Unset → no catalog servers (fail
  closed). An unknown `serverId` fails the boot, like the rest of the MCP config. Env: `PERSONAL_ASSISTANTS`
  (JSON).
- **The client chooses**, as the host already names an agent (`agentId`): with no `agentId`, a back-office
  embed (`agents` / `multiAgent`) talks to `back-office-assistant`, any other embed to `portal-assistant`. The
  host is not a usable distinction (the back office is a path on the main portal's domain). The server's
  default, for a `hello` naming none, is `portal-assistant`: the narrower one.
- The back-office agent picker offers `back-office-assistant`. The history keeps listing the person's threads
  with either assistant; a thread carries its agent, so resuming it keeps its tools.
- **Kept from f1c630c:** every non-read-only catalog call of either assistant asks the person; anonymous
  visitors get reads only; the conversation's owner decides. **Retired:** the `apiKey` exclusion — an operator
  naming an assistant's servers explicitly makes that choice deliberately.
- No migration: no released version stored conversations (v0.12.1 had the gateway only). Dev threads with
  `agentId: 'personal'` stop resolving.

## Out of scope

Per-organization configuration of the assistants (stored, edited on the admin page) — possible later, as the
configured agents' shape is already the same.
