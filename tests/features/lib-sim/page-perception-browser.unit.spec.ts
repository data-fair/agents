/**
 * The persona's page tools against a real browser page: iframes, keys, new tabs and the
 * screen as an image. Fakes cannot tell whether Playwright descends into a frame or fires
 * a popup event, which is what these capabilities are made of.
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { createPagePerception, normalizeAiSnapshot } from '../../../lib-sim/page-perception.ts'

const FRAMED = `<h1>Back-office</h1>
<iframe srcdoc="<label>Titre <input></label><button onclick='this.textContent=&quot;Enregistré&quot;'>Enregistrer</button><iframe srcdoc='<p>Aperçu profond</p>'></iframe>"></iframe>`

test.describe('frames', () => {
  test('a root that opts in sees and acts inside nested iframes', async ({ page }) => {
    await page.setContent(FRAMED)
    await page.frameLocator('iframe').locator('button').waitFor()
    const p = createPagePerception([{ label: 'page', root: page, frames: true }])
    const seen = await p.call('look', {})
    assert.match(seen, /button "Enregistrer"/)
    assert.match(seen, /Aperçu profond/, 'a frame inside a frame is seen too')
    assert.doesNotMatch(seen, /\[ref=|\[cursor=|\[active\]/, 'the AI snapshot annotations are not the person\'s business')
    assert.equal(await p.call('type', { name: 'Titre', text: 'Agenda' }), 'typed into "Titre"')
    assert.equal(await p.call('click', { name: 'Enregistrer' }), 'clicked "Enregistrer"')
    assert.match(await p.call('look', {}), /button "Enregistré"/)
  })

  test('a control in a later frame wins over the same words as text in an earlier one', async ({ page }) => {
    // A judged run: the chat frame's reply mentioned « Barre de navigation », the editor's tab
    // of that name sat in another frame, and the click landed on the chat's words.
    await page.setContent(`<iframe srcdoc="<p>Ouvrez l'onglet Barre de navigation</p>"></iframe>
<iframe srcdoc="<div role=tablist><button role=tab aria-selected=true>Général</button><button role=tab onclick='this.setAttribute(&quot;aria-selected&quot;,&quot;true&quot;);this.previousElementSibling.setAttribute(&quot;aria-selected&quot;,&quot;false&quot;)'>Barre de navigation</button></div>"></iframe>`)
    await page.frameLocator('iframe').nth(1).getByRole('tab', { name: 'Barre de navigation' }).waitFor()
    const p = createPagePerception([{ label: 'page', root: page, frames: true }])
    assert.equal(await p.call('click', { name: 'Barre de navigation' }), 'clicked "Barre de navigation"')
    assert.match(await p.call('look', {}), /tab "Barre de navigation" \[selected\]/)
  })

  test('a drop-down is clicked rather than its label text', async ({ page }) => {
    // a judged run clicked « Type de lien »: the label text was hit, the drop-down of that
    // name never opened, and the person reported the product as broken
    await page.setContent('<label for="t">Type de lien</label><select id="t" onclick="document.body.dataset.opened=1"><option>Page libre</option></select>')
    const p = createPagePerception([{ label: 'page', root: page }])
    assert.equal(await p.call('click', { name: 'Type de lien' }), 'clicked "Type de lien"')
  })

  test('a root that does not opt in keeps the plain outline', async ({ page }) => {
    await page.setContent(FRAMED)
    const p = createPagePerception([{ label: 'page', root: page }])
    assert.doesNotMatch(await p.call('look', {}), /Enregistrer/)
  })
})

test.describe('the AI snapshot, normalized', () => {
  test('drops annotations and unnamed wrappers, keeps what a person reads', () => {
    const ai = [
      '- generic [active] [ref=e1]:',
      '  - heading "Titre" [level=1] [ref=e2]',
      '  - link "Voir" [ref=e4] [cursor=pointer]:',
      '    - /url: https://example.com',
      '  - iframe [ref=e5]:',
      '    - generic [ref=f1e1]:',
      '      - generic [ref=f1e2]: Nom du portail',
      '      - button "Dans le cadre" [ref=f1e4]'
    ].join('\n')
    assert.equal(normalizeAiSnapshot(ai), [
      '- heading "Titre" [level=1]',
      '- link "Voir":',
      '  - /url: https://example.com',
      '- iframe:',
      '  - text: Nom du portail',
      '  - button "Dans le cadre"'
    ].join('\n'))
  })
})

test.describe('keys', () => {
  test('presses a key in a named field', async ({ page }) => {
    await page.setContent('<form onsubmit="event.preventDefault();document.querySelector(\'p\').textContent=\'envoyé\'"><label>Recherche <input></label></form><p>rien</p>')
    const p = createPagePerception([{ label: 'page', root: page }])
    await p.call('type', { name: 'Recherche', text: 'piscines' })
    assert.equal(await p.call('press', { key: 'Enter', name: 'Recherche' }), 'pressed Enter in "Recherche"')
    assert.match(await p.call('look', {}), /envoyé/)
  })

  test('presses a key wherever the focus is', async ({ page }) => {
    await page.setContent('<dialog open>Une fenêtre</dialog><script>addEventListener("keydown", e => { if (e.key === "Escape") document.querySelector("dialog").close() })</script>')
    const p = createPagePerception([{ label: 'page', root: page }])
    assert.equal(await p.call('press', { key: 'Escape' }), 'pressed Escape')
    assert.doesNotMatch(await p.call('look', {}), /Une fenêtre/)
  })

  test('refuses what is not a key, and the off-limits composer', async ({ page }) => {
    await page.setContent('<label>Message <input></label>')
    const p = createPagePerception([{ label: 'page', root: page }], { offLimits: ['Message'] })
    assert.match(await p.call('press', { key: 'rm -rf' }), /not a key/)
    assert.match(await p.call('press', { key: 'Enter', name: 'Message' }), /not yours to operate/)
  })
})

test.describe('tabs', () => {
  test('a link opening a new tab takes the person there, and back', async ({ page, context }) => {
    await context.route('https://portal.test/**', route => route.fulfill({ contentType: 'text/html; charset=utf-8', body: '<title>Portail public</title><h1>Agenda des événements</h1>' }))
    await page.setContent('<a href="https://portal.test/agenda" target="_blank">Voir sur le portail</a>')
    const p = createPagePerception([{ label: 'page', root: page }])
    assert.match(await p.call('click', { name: 'Voir sur le portail' }), /opened a new tab/)
    const seen = await p.call('look', {})
    assert.match(seen, /Agenda des événements/)
    assert.match(seen, /tab 2/)
    assert.doesNotMatch(seen, /link "Voir sur le portail"/, 'the person looks at one tab at a time')
    assert.match(await p.call('switch_tab', { tab: 1 }), /tab 1/)
    assert.match(await p.call('look', {}), /link "Voir sur le portail"/)
    assert.match(await p.call('switch_tab', { tab: 7 }), /no tab 7/)
  })
})

test.describe('the screen as an image', () => {
  test('shows colours the outline cannot, and records that it did', async ({ page }) => {
    await page.setContent('<button style="background:#1b5e20;color:white">Valider</button>')
    const p = createPagePerception([{ label: 'page', root: page }])
    const content = await p.callContent('screenshot', {})
    const image = content.find(c => c.type === 'image')
    assert.ok(image && image.type === 'image')
    assert.equal(image.mimeType, 'image/jpeg')
    assert.ok(Buffer.from(image.data, 'base64').length > 1000)
    const recorded = p.observations.at(-1)
    assert.equal(recorded?.tool, 'screenshot')
    assert.match(recorded?.result ?? '', /screenshot/)
  })
})
