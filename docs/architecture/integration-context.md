# Integration context (data-fair & portals)

The assistant is rarely used standalone. It is normally **embedded into a host
application** — most often the **data-fair** back-office or the **portals**
manager. When reviewing a session, assume this context unless the trace clearly
shows otherwise: the tools, links, and user intent all come from the host.

## How it is embedded

- The chat UI runs in a **browser iframe** beside the host application and shares
  the user's session (the authenticated user or organization is the owner). The
  agent loop itself runs **on the agents server**; the iframe is connected to it
  by a websocket agent session (see [Embedding](./embedding.md)).
- The host's page tools execute **client-side**: the host exposes them over
  **WebMCP via a BroadcastChannel**, the iframe declares them to the server, and
  the server sends each call back down the socket for the page to run. The
  agents service never calls the host's API for those tools.
- The personal assistant also receives the tools of the deployment's MCP server
  catalog (`config.mcpServers`, empty by default), called **server-side** with
  the person's forwarded session. Every tool result reaches the model inside a
  provenance envelope naming its source; for page tools that name is `the-page`.
- Integration is enabled per account, so not every account exposes host tools.

## Tools the agent typically encounters

### data-fair back-office

A rich tool surface (dozens of tools across sub-agents). The main families:

- **Navigation:** `navigate`, `list_pages`, `get_current_location`.
- **Dataset exploration:** `list_datasets`, `describe_dataset`,
  `get_dataset_schema`, `search_data`, `aggregate_data`, `calculate_metric`,
  `get_field_values`.
- **Metadata & expressions:** `set_dataset_summary`, `set_dataset_description`,
  `set_expression`, `test_expression`, `set_property_config`.
- **Data entry:** `open_add_line_dialog`, `open_edit_line_dialog`.
- **Applications (visualizations):** `list_applications`,
  `describe_application`, `get_application_config`.
- **Creation wizards** for new datasets and applications.
- **Connectors & catalogs:** `list_processings`, `list_catalogs`,
  `explore_github`; geolocation: `geocode_address`, `get_user_geolocation`.

### portals manager

A narrow surface: VJSF form sub-agents only — `pageConfig_form` and
`portalConfig_form` — which translate natural-language requests into form
mutations. The user still reviews and saves the form.

## Domain vocabulary

- **Dataset** — tabular data with a schema (typed columns), exposed as an API.
- **Application** — an interactive visualization (chart, map, table) built on
  one or more datasets.
- **Portal** — a public website publishing selected datasets and applications.
- **Users** are typically back-office administrators, dataset owners, or portal
  designers exploring or configuring data — not anonymous end-users.

## Quirks a reviewer should weigh

- **Absolute URLs are intentional.** Tool responses carry full absolute URLs and
  the assistant is told to use them verbatim; relative links break inside the
  cross-origin iframe. A response that "rewrote" a link to a relative path is a
  bug, not a cleanup.
- **`_c_`-prefixed column filters silently match nothing.** A filter like
  `_c_ville_eq` instead of `ville_eq` returns no rows without erroring.
- **Filter capability is error-driven.** The agent is not given an exhaustive
  per-column capability list; invalid filters return HTTP 400 with guidance and
  the agent self-corrects. Some 400s are therefore normal exploration, not
  failures.
- **Metadata/expression writes only fill the edit form.** Tools such as
  `set_dataset_summary`, `set_expression`, and `set_property_config` populate the
  host's client-side form; the user must still Save/Publish. The agent cannot
  commit changes autonomously, so "nothing was saved" can be expected behaviour.
- **`<host-state>` and `<host-events>` blocks are host-reported, not user-written.** They
  appear inside a user turn's hidden context or appended to a tool result, and say so.
  The user-turn blocks decorate the model request only and are not stored, so a
  reviewer sees host events only where a tool or wait result carried them. The chat
  itself reports some host state too: the person's language, organization, whether
  the widget is narrow, whether diagrams render.
  An assistant acting on them ("I see you created the dataset") is reading the
  application, not inventing; an assistant calling `wait_for_user_action` and resuming
  on the user's click is the intended hand-back, not a stall. See
  [Host events](./host-events.md).
