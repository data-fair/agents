---
description: Run lint, type-check, and tests
agent: build
---
Run all quality checks for this project in sequence. Stop and fix any issues before moving to the next step.

1. `npm run lint-fix`
2. `npm run build-types`
3. `npm run check-types`
