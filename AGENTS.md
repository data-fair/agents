# Development notes for agents

## Typing

Types are mostly managed from JSON schemas and prepared using `npm run build-types`.

## Quality checks

1. Linter: `npm run lint-fix`
2. Type checking: `npm run check-types`
3. Docker build passing: `docker build -t agents .`

## Testing

Test dependencies should be run by the user. You can check in @.env for the ports that will be used. If a container is not up or if the dev api server is not available or any error of this kind DO NOT try to fix the situation yourself and ask the user for help.

2. Run tests: `npm run test`
3. Run specific tests: `npm run test-base test-it/specific-test.ts`

To debug errors you can access the logs of the dev API server @dev/logs/dev-api.log and the dev UI server @dev/logs/dev-api.log. Prefer using `tail`and `grep` in a sub-agent to use these files without building too large of a context.

Test users are defined in @dev/resources/users.json and organizations in @dev/resources/organizations.json. If modifying these files you need to force reload of the simple-directory container `docker compose restart simple-directory`.

## Code patterns

When working on this project, read the following files on a need-to-know basis to understand conventions:

- API route pattern: @api/src/settings/router.ts
- API service pattern: @api/src/settings/service.ts
- Dataset tool pattern: @api/src/tools/datasets/search-data.ts
- MCP server setup: @api/src/mcp/server.ts
- Vue page pattern: @ui/src/pages/settings.vue
- Test pattern: @test-it/settings.ts
- Type generation from JSON schemas: @api/types/settings/schema.js
