---
description: Run tests (optionally a specific test file)
agent: build
---
Run tests for this project. Stop and report any failures.

If arguments are provided, run the specific test:
`npm run test-base test-it/$ARGUMENTS`

If no arguments are provided, first start test dependencies then run the full suite:
`npm run test-deps && npm run test`
