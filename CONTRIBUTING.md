# Contributing to Agents

## Getting Started

### Prerequisites

- Node.js, the version of `.nvmrc` (start zellij from a shell on it: the panes inherit its PATH)
- Docker and Docker Compose v2
- zellij >= 0.44

### Development Setup

The dev environment is the shared one of the data-fair services (`@data-fair/lib-dev`): a zellij
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
