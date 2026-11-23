# Contributing to Agents

## Getting Started

### Prerequisites

- Node.js, the version of `.nvmrc` (start zellij from a shell on it: the panes inherit its PATH)
- Docker and Docker Compose v2
- zellij >= 0.44, only for the zellij setup below

### Quick start

```bash
npm ci
npm run dev
```

Docker is required: mongo, simple-directory and nginx run in containers; the api, the ui and the dev MCP
server run in the terminal (Ctrl+C stops them, their logs are in `dev/logs/`). The app is available at
<http://localhost:5700/agents/>.

Then, in another terminal:

```bash
npm test
```

The default ports (5700-5711) are in `dev/default.env`, copied to `.env` the first time: `.env` overrides
`dev/default.env` and is never overwritten. `npm run dev-deps` only starts the containers (extra arguments go
to docker compose, e.g. `npm run dev-deps -- --profile events`); `npm run dev` accepts the same arguments.

Each dev process has its own npm script and reads its settings from environment variables (every key of
`dev/default.env`): `npm run dev-setup` (idempotent builds, no container), then `npm run dev:api`,
`npm run dev:ui`, `npm run dev:mcp` (and `npm run dev:bridge`, the Claude Code bridge of the dev workspace and
the simulations, not started by `npm run dev`), each in its own terminal with the variables of `.env`
exported. The optional events service is absent when `EVENTS_PORT` is empty; `npm run dev` blanks it when
its container is not running. `DEV_LOG_DIR` (default `dev/logs`) and `DEV_LOG_PREFIX` set where `npm run dev`
writes the logs of the processes.

The fixed ports mean one environment per machine: stop the containers of one checkout
(`npm run stop-dev-deps`) before starting another.

### Development Setup with zellij

The dev environment is also the shared one of the data-fair services (`@data-fair/lib-dev`): a zellij
session per checkout, described by `.zellij.kdl` and `dev/dev.json`.

1. Install dependencies, then write `.env` (free ports drawn for this checkout), build the types, the
   workspace packages and the UI:
   ```bash
   npm ci
   npx --no df-dev setup
   ```

2. Start the session (containers, API, UI, dev MCP server; the Claude Code bridge pane starts
   suspended, press Enter in it to use it):
   ```bash
   npm run dev-zellij                       # core containers only
   npm run dev-zellij -- --services events  # plus the optional events service
   ```
   The footer pane prints the URL. `npx --no df-dev status` shows what runs.

3. A new branch in its own worktree, from the main checkout:
   ```bash
   npx --no df-worktree <branch>          # creates ../agents_<branch>, npm ci + setup
   npx --no df-worktree-delete <branch>   # removes it with its containers and zellij session
   ```
   Branch names: letters, digits, `.`, `_`, `-`, no `/`, and `agents_<branch>` at most 60 characters.

4. Install browser automation skills (for the `@web-browser` coding agent):
   ```bash
   npm install -g @playwright/cli@latest
   playwright-cli install --skills
   ```

### Running Tests

```bash
npm run test         # the whole suite (~ what pull requests run)
npm run test-smoke   # the @smoke api/e2e set
```

See `docs/architecture/testing.md` for the test levels and what runs on commit, push and pull request.

### Code Style

This project uses:
- ESLint for JavaScript/TypeScript linting
- Prettier for code formatting (via ESLint)
- Conventional Commits for commit messages

Run linting:
```bash
npm run lint
```

Run linting with auto-fix:
```bash
npm run lint-fix
```

### Docker

Build the Docker image:
```bash
docker build -t agents .
```

Run the container:
```bash
docker run -p 8080:8080 agents
```
