# Agent files

An autonomous agent can **move files without their bytes passing through the model**: download one (from
the web, or from a catalog tool such as a data-fair export), read and write small text files, and hand a
file to a catalog tool that takes one (create a dataset from a CSV). Files are on for every configured
agent as soon as the deployment configures a file store (`files`, see [Configuration](./configuration.md#files));
there is no per-agent toggle, because what an agent can *do* with a file is already governed by
`fetch_url`'s allowlist and the approval policy on catalog tools. The personal assistant has none: it has
no web access, and its files would come from attachments the person adds, a separate feature.

Without a file store **nothing file-related appears**: no file tools, no `saveAs`, and catalog tools with
a file argument are not offered (the MCP server only fetches our signed URLs, so the model could not fill
them); `get_my_configuration` says files are off and lists those tools as needing a file store. That is the
same code path as the personal assistant's (`files` undefined in `performTurn`), which the tests use.

Code mode (scripts that read and write files and call tools) builds on this and is not implemented; its
interaction with the loop guards is noted in [Loop guards](./loop-guards.md#forward-code-mode). The design:
`docs/superpowers/specs/2026-10-12-agent-files-and-scripting-design.md`.

## The store

`api/src/files/`: two backends behind one interface (`types.ts`), modelled on data-fair's
`api/src/files-storage/` (same method names and semantics, the subset the agents need) so the two can
converge. Listings return files only, relative to the listed prefix.

- `fs` (`files.dataDir`): a directory, **on a volume shared by every node** when the service is scaled
  (data-fair's rule for its `dataDir`). A write goes to a hidden temp file beside the target, is synced,
  then renamed: a failed or interrupted write never leaves a truncated file under a real name, and the
  hidden temp files never show in the model's listing (only the sweep lists them, `includeHidden`).
- `s3` (`files.s3`): `@aws-sdk/client-s3` + `@aws-sdk/lib-storage`, as data-fair. Listings are paginated
  (the sweep reads the whole store), and checksums are `WHEN_REQUIRED`: the SDK's default trailing
  checksums use `aws-chunked` bodies that several S3-compatible stores refuse.

Both are tested by one shared contract (`tests/features/files/backends.unit.spec.ts`). The S3 backend's own
logic runs against `aws-sdk-client-mock`; the same contract also runs against a real S3-compatible server
when `S3_TEST_ENDPOINT` is set (for example data-fair's dev RustFS), which no mock can vouch for.

Keys are `agent-files/<owner type>/<owner id>/<conversation id | task-run id>/<name>`. A **file is a flat
virtual path**, `/report.csv`, the convention of Claude Code, LangChain deepagents, Mastra and the MCP
filesystem server. The model supplies only the name, which must be one segment of 1-100 characters
`[A-Za-z0-9._-]` with an extension and no `..` (refused otherwise, with an example of a valid one), so it
cannot address outside its prefix: scoping is by construction. Names from response headers are
transliterated into that set. Writing an existing name overwrites it. A file's metadata is its own: size
and last write from the backend, type from the extension (data-fair types an upload the same way), with
no side record; where it came from is in the transcript, which is the audit.

**Why a conversation and not a turn:** an approval ends a turn and the decision starts a new run, so the
most common flow (download, transform, *gated* upload) spans two turns. A task run has its own files.
**Why a shared store and not pod-local temp:** the MCP server's fetch of a file URL can reach any pod.

**Bounds**: 100 MB per file; 500 MB per conversation or task run. The scope total is the sum of the
listing before a write (the file being overwritten not counted), and both bounds are enforced again **while
the bytes stream**: a missing or lying `Content-Length` changes nothing, and a download over a bound is
aborted, never stored truncated. Storage is not charged to credits. A storage failure tells the model only
the error's `code` or `name` ("The file store failed (…); your other tools still work"); the full error,
which carries paths and keys, goes to the debug log. The scope bound is checked per write, so saves running
in parallel can overshoot it by what they add together. A write over an existing name (`write_file`, or a
saved link or download named alike) replaces the file and **resets its 7-day clock**.

**Lifetime**:
- Deleting a conversation deletes its files at once, whether it is purged or archived (files are not review
  material). The delete lives inside `purgeConversation` and `archiveConversation`, so every purge path
  gets it, an admin's GDPR erasure included. It is logged, never thrown: the conversation is already gone.
- One hourly sweep (`sweepFilesOnce`, one instance at a time under a lock) lists `agent-files/` and removes
  what was last written more than 7 days ago, the same on both backends. On `fs` the listing includes the
  hidden `.<name>.<id>.part` temp files, so one a hard crash orphaned is removed by the same rule. A file that fails to delete is
  logged and the pass goes on; the next pass retries it.
- Deleting an agent bulk-deletes its conversations; `deleteAutonomousAgentData` then deletes each one's
  files at once (logged, never blocking). Its task runs' files, and anything a crash left behind, are left
  to the sweep: the one cleanup that needs no bookkeeping.
- A file in use is not renewed: past 7 days, the agent downloads it again.

At boot, `assertFilesConfig` validates the configuration and `checkAccess` fails the start when the store
cannot be reached, as data-fair's does (on S3 its probe object lives under `agent-files/`, so a credential
limited to that prefix passes).

## The tools

| Tool | Does |
|---|---|
| `ls()` | the scope's files: path, type, size, expiry, and how much of the 500 MB is used |
| `read_file({ file_path, offset?, limit? })` | a page of a text file by lines (0-based `offset`, 500 lines by default, at most 2,000 and 20,000 characters), numbered like `cat -n`, with where to read on (an `offset` or `limit` that is not an integer is refused, not defaulted); at most the first 10 MB of a file; a line over 20,000 characters is cut and says so; a binary file answers its metadata and that it can be passed to a tool |
| `write_file({ file_path, content })` | creates or overwrites a text file (an extension of a text type), at most 1 MB |

Named and shaped after Claude Code's and deepagents' tools, so the model meets names it was trained on. No
`edit_file`, `glob`, `grep` or `delete_file`: files expire and nothing needs them yet. `write_file` is
limited to 1 MB of text because anything larger is a download. They are service tools (provenance server
`agent-files`), outside the approval policy, on every surface. Their schemas are advertised, not enforced,
by the AI SDK, so the tools validate their own input.

## In: downloads

**One download function** (`download.ts`, `openDownload`) streams a URL into the store: GET only; public
addresses only, checked at DNS resolution (the web module's `publicDispatcher`, `SSRF_PUBLIC_IPS`
exceptions) and, because a literal IP is never resolved, on the URL itself; 15 s to the headers, 30 s of
idle body and **5 minutes overall**; 5 redirects; **never the shared web cache**, which is shared because
nothing it fetches is credentialed, and a download may be. Whether it sends credentials is a parameter its
callers set; no tool schema exposes it, so the model never chooses. Every message shows a URL as origin and
path only (`displayUrl`): a redirect target or a link can be presigned. The one exception is a successful
`fetch_url` result, which reports the URL that answered.

1. **`fetch_url` with `saveAs`** stores the response whatever its type and answers
   `{ file_path, mimeType, size }`. The URL comes from the model, so it is **always anonymous and
   allowlisted at every redirect hop**: a credentialed fetch would let the agent read any route its
   identity reaches, outside the toolset an admin selected. Without `saveAs`, `fetch_url` is unchanged,
   except that a declared binary type is refused **from the headers, before the body is read**, with a hint
   to use `saveAs` when files are on (see [Web access](./web-access.md)). With files on, its recorded
   annotations say it is not read-only: it can write, and overwrite, a file.
2. **A `resource_link` in an MCP result** is fetched automatically and replaced by the stored file. MCP
   2026-07-28 sanctions `https` resource URIs the client fetches itself; who authenticates is our
   convention, **the credential rule** (`linkCredentialSite`): the link is fetched *as its call was made*,
   with the call's own session and without the allowlist, only when a **catalog** server returned it and its
   origin is **the site that call was bound to** (home site or portal). The URL is then the output of a tool
   an admin selected, on the site the call acted on. A bound-site fetch never leaves its origin: a redirect
   elsewhere is refused, so the session cannot follow it. The session is the turn's own
   `SiteCredentials.cookieFor(site)`, the per-site cache the catalog calls use, so a link fetch costs no new
   exchange. Every other link is fetched anonymously under `fetch_url`'s allowlist: one from an external
   MCP server, from a catalog entry that is not site-bound, or on another origin. One ruling to know: a
   catalog link on the bound site when the account has **no session** there is fetched anonymously but
   still without the allowlist, because the rule is where the URL came from, not whether a cookie exists.

A fetched link is **named** from its response's `Content-Disposition`, else the link's `name`, else its
URL's last segment, with an extension from the response type, else the link's `mimeType`, else `.bin`:
data-fair's `/raw` and `/convert` links carry no extension and no type, and a file stored without its
extension could not be uploaded again. The result's text block also names the URL: it is rewritten to the
stored path, and a closing line lists what was saved, so the model sees one consistent reference. Two
links named alike in one result get `-2`, `-3`. A link that cannot be saved does **not** fail the call:
the tool already ran (a retry would repeat its side effects) and turning a store on must not break tools that
worked. The result keeps the text (each saved link rewritten to its path), then one line per failure, "Could not save
the file linked as <name or address without query>: <reason>". Embedded `blob`
resources are not handled (nothing returns them; openapi-mcp returns links); image results keep their
behaviour. An `isError` result has the URI of any link it carried reduced to origin and path.

## Out: a file passed to a tool

A tool input property `{ type: 'string', format: 'uri', 'x-mcp-file': { accept?, maxSize? } }` at the top
level (openapi-mcp produces nothing deeper) takes a file. `x-mcp-file` is the keyword of the MCP file-input
proposals (SEP-2356, superseded by the open draft SEP-2631); `contentMediaType` is not used, since in JSON
Schema it says the string *is* the bytes. `x-mcp-file: true` is read like the object form. The model is offered a plain string "the path of one of your
files", with `accept` and `maxSize` in the description; the target enforces them. **External MCP servers'**
tools that take a file are never offered: `files.publicUrl` is where the platform's own servers reach this
API, often an internal address, so the call could not succeed.

At execution the path becomes a **signed file URL** served by the agents API:
`GET|HEAD <files.publicUrl>/api/files/<owner type>/<owner id>/<scope>/<name>?exp=<unix>&sig=<base64url HMAC-SHA256>`,
signed with `files.secret` over `<owner type>/<owner id>/<scope>/<name>\n<exp>`, valid 600 s, read-only, one
file, no session. The call path first checks the file exists, so a typo is "There is no file named …" with
the list, not a 404 from the target. The route:
- validates every path component with the predicates that build keys (400 for a path that could not have
  been signed), then compares the signature in constant time **before** reading the expiry: no existence
  oracle, and an invalid URL learns nothing;
- streams the file from whichever backend with its exact `Content-Length` (data-fair answers 411 to a
  chunked upload) and the type of its extension; `HEAD` is answered from the file's stats without opening it;
- answers `private, no-store`, with the file name as the last path segment: openapi-mcp names the upload
  from it.

**One upload path for both backends**: MCP servers only ever fetch from the agents API, S3 credentials never
leave it, and there is no presigned-URL host juggling; the cost is that upload bytes stream through an
agents pod. `files.publicUrl` is exactly the prefix MCP servers configure as `FILE_URL_PREFIXES`. Precedent:
ChatGPT's Apps SDK passes a temporary `download_url` the MCP server fetches (`openai/fileParams`); if
SEP-2631 lands, its `mcp-file:` values are one more accepted form.

**Records keep the path, never the URL.** The URL is made at execution, after the call was recorded: the
stored input, the approval card (path, type and size, from `toolMetadata.files`) and the transcript hold the
path, and an approved call replays with a URL signed at that moment, not at the request. The model never
sees a URL. One a target echoes back is scrubbed to the path, whole and without its query, in the result
and in an error's message, stack and cause chain; a last pass strips any `exp=`/`sig=` pair left by an echo that changed the URL (`&amp;`, percent-encoding). A file argument that is not a string is refused with the invalid-path message.

## One call path

Both directions live in **the call path** (`call-path.ts`, `withCallPath`), the layer every tool call goes
through: `modelTools` (`api/src/conversations/operations.ts`) wraps each tool in it, *inside* the provenance
envelope. It receives the model's input after the stream loop recorded it (and after the SDK's approval
request carried it), signs the call's file arguments for that call only, and turns a `LinkedToolResult`
(what the MCP clients return when a result carries links, with `catalog` and the call's `site`) into
stored files and text. A call made by the model and, with code mode, a call made from a script are then the
same call: same file handling, same recording, same guards.

## Errors the model reads

| Failure | Told |
|---|---|
| unknown or expired file | "There is no file named /x.csv here." and the files that exist |
| invalid name | why, with an example of a valid path |
| file over 100 MB | the cap; nothing stored |
| conversation over 500 MB | the cap and the current total |
| file store unreachable | named as a storage failure with the error code; other tools keep working |
| link fetch refused | the call succeeds; a line "Could not save the file linked as …" with the download's own message |

## Sources

- MCP specification 2026-07-28, tools and resources: https://modelcontextprotocol.io/specification/latest/server/tools
- SEP-2631 File Objects and Transfer (draft): https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2631; SEP-2356: https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2356; File Uploads WG: https://modelcontextprotocol.io/community/working-groups/file-uploads
- OpenAI Apps SDK `openai/fileParams`: https://developers.openai.com/apps-sdk/reference
- JSON Schema 2020-12 §8.4 (`contentMediaType`): https://json-schema.org/draft/2020-12/json-schema-validation#section-8
- deepagents filesystem tools: https://docs.langchain.com/oss/javascript/deepagents/backends; Claude Code tools: https://code.claude.com/docs/en/tools-reference
- data-fair's files storage: `data-fair/api/src/files-storage/`
