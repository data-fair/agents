# Integration context (data-fair & portals)

The assistant is rarely used standalone. It is normally **embedded into a host
application** — most often the **data-fair** back-office or the **portals**
manager. When reviewing a session, assume this context unless the trace clearly
shows otherwise: the tools, links, and user intent all come from the host.

## How it is embedded

- The chat runs in a **browser iframe** beside the host application and shares
  the user's session (the authenticated user or organization is the owner).
- Tools are provided by the host and execute **client-side** over **WebMCP via a
  BroadcastChannel** between the iframe and the host frame. The agents service
  itself never calls the host's API directly — it only orchestrates the model
  and forwards tool calls back to the host frame.
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

## Quirks an evaluator should weigh

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
