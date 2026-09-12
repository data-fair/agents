import neostandard from 'neostandard'
import dfLibRecommended from '@data-fair/lib-utils/eslint/recommended.js'

export default [
  // dev/* is ignored, but it prunes subdirectories too — the claude-bridge is real
  // source with unit tests, so it is explicitly linted.
  { ignores: ['ui/*', '**/.type/', 'dev/*', '!dev/claude-bridge', '!dev/claude-bridge/**', 'node_modules/*', 'lib-vue/*.js', 'lib-vue/*.d.ts', 'lib-vuetify/*.js', 'lib-vuetify/*.d.ts'] },
  ...dfLibRecommended,
  ...neostandard({ ts: true })
]
