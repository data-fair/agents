import { defaultNonceCSPDirectives } from '@data-fair/lib-express/index.js'

/**
 * The SPA's CSP: the stack's nonce policy, with images from the site only. The stack allows any https image
 * ("free img integration"), but here a model writes the page: an image it is made to write loads with no click
 * and carries whatever its URL holds (ui/src/utils/markdown.ts, which turns such an image into a link).
 */
export const SPA_CSP_DIRECTIVES: Record<string, string> = {
  ...defaultNonceCSPDirectives,
  'img-src': "'self' data: blob:"
}
