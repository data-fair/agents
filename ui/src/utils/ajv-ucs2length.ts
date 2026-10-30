/**
 * Stands in for `ajv/dist/runtime/ucs2length.js` in the compiled vjsf forms (aliased in vite.config.ts).
 *
 * @json-layout/core (2.8 to 2.12 at least, compile/serialize.js) turns ajv's `require("…/ucs2length").default`
 * into `import ucs2length from "…/ucs2length.js"` then `ucs2length.default`: it strips that `.default` for
 * ajv's `equal`, not for this one. That second `.default` holds only where the default import is the whole
 * CommonJS module, as in vite's dev pre-bundling; the production build follows the module's __esModule flag
 * and gives the function itself, so any form with a maxLength threw "is not a function" in production
 * only and rendered empty. Whatever the bundler hands over, this gives the generated code its `.default`.
 */
import * as ucs2lengthModule from 'ajv/dist/runtime/ucs2length'

type Ucs2length = (str: string) => number
const imported: any = (ucs2lengthModule as any).default
const ucs2length: Ucs2length = typeof imported === 'function' ? imported : imported.default

export default { default: ucs2length }
