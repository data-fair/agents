# Contributing to Agents

## Getting Started

### Prerequisites

- Node.js, the version of `.nvmrc`
- Docker and Docker Compose v2

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

The default ports (5700-5710) are in `dev/default.env`, copied to `.env` the first time: `.env` overrides
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

### Browser automation skills

For the `@web-browser` coding agent:

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
