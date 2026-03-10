# Development notes for agents

## Typing

Types are mostly managed from JSON schemas (for example @api/types/settings/schema.js), prepared using `npm run build-types` and imported from #types in which is an alias for @api/types/index.ts.

## Quality checks

1. Linter: `npm run lint-fix`
2. Type checking: `npm run check-types`
3. Docker build passing: `docker build -t agents .`

## Testing

Test dependencies should be run by the user, not you. You can check in @.env for the ports that will be used. If a container is not up or if the dev api server is not available or any error of this kind stop and ask the user for help.

2. Run tests: `npm run test`
3. Run specific tests: `npm run test tests/features/settings.spec.ts`

Test users are defined in @dev/resources/users.json and organizations in @dev/resources/organizations.json. Modify these as little as possible, but if you do you need to force reload of the simple-directory container `docker compose restart simple-directory`.

Tests are separated in @unit (pure functions) @api (stateful layers through HTTP) and @e2e (UI with playwright browser intrumentation) playwright projects in the same test suite. When working on the e2e part you can use subagents `playwright-test-generator` and `playwright-test-generator`.

In case of failures you might find error contexts in @test-results.

## Code patterns

When working on this project, read the following files on a need-to-know basis to understand conventions:

- API route pattern: @api/src/settings/router.ts
- API operations pattern: @api/src/settings/operations.ts
- Dataset tool pattern: @api/src/tools/datasets/search-data.ts
- MCP server setup: @api/src/mcp/server.ts
- Vue page pattern: @ui/src/pages/settings.vue
- Test pattern: @tests/features/settings.spec.ts
- Type generation from JSON schemas: @api/types/settings/schema.js
