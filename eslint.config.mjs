import neostandard from 'neostandard'
import dfLibRecommended from '@data-fair/lib-utils/eslint/recommended.js'

export default [
  { ignores: ['ui/*', '**/.type/', 'dev/*', 'node_modules/*', 'lib-vue/*.js', 'lib-vue/*.d.ts', 'lib-vuetify/*.js', 'lib-vuetify/*.d.ts'] },
  ...dfLibRecommended,
  ...neostandard({ ts: true })
]
