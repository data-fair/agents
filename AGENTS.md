# Development notes for agents

## Typing

Types are mostly managed from JSON schemas and prepared using `npm run build-types`.

## Quality checks

1. Linter: `npm run lint-fix`
1. Type checking: `npm run check-types`

## Testing

1. Start test dependencies: `npm run test-deps`
2. Run tests: `npm run test`
3. Run specific tests: `npm run test-base test-it/specific-test.ts`

## Docker

```bash
docker build -t agents .
docker run -p 8080:8080 agents
```
