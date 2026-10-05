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

  test('a control covered by its own field is clicked where a person would click', async ({ page }) => {
    // Vuetify keeps a select's input under the field's div: a judged run's click on « Type de
    // lien » waited 15 s on « intercepts pointer events » and the person called it broken
    await page.setContent(`<div style="position:relative;width:200px;height:40px">
      <input role="combobox" aria-label="Type de lien" style="position:absolute;inset:0;width:100%">
      <div style="position:absolute;inset:0" onclick="document.body.dataset.opened='1'"></div>
    </div>`)
    const p = createPagePerception([{ label: 'page', root: page }])
    const started = Date.now()
    assert.equal(await p.call('click', { name: 'Type de lien' }), 'clicked "Type de lien"')
    assert.equal(await page.evaluate(() => document.body.dataset.opened), '1')
    assert.ok(Date.now() - started < 10000, 'it does not wait out the whole action timeout')
  })

  test('a root that does not opt in keeps the plain outline', async ({ page }) => {
    await page.setContent(FRAMED)
    const p = createPagePerception([{ label: 'page', root: page }])
    assert.doesNotMatch(await p.call('look', {}), /Enregistrer/)
  })
})

// A list that renders only its visible options, as Vuetify's select does: 14 options, 5 on screen.
const VIRTUAL_LIST = `<div role="listbox" aria-label="Type de page" style="height:150px;overflow:auto">
<div id="pad" style="position:relative;height:420px"></div></div>
<script>
const names = ['Accueil', 'Contact', 'Accessibilité', 'Mentions légales', 'Politique de confidentialité', 'Politique de cookies', 'Catalogue de données', 'Catalogue de visualisations', 'Catalogue de réutilisations', 'Catalogue d\\'événements', 'Catalogue d\\'actualités', 'Plan du site', 'Documentation d\\'API', 'Autre']
const list = document.querySelector('[role=listbox]'), pad = document.getElementById('pad')
const render = () => {
  const first = Math.floor(list.scrollTop / 30)
  pad.innerHTML = names.slice(first, first + 5).map((n, i) => '<div role="option" style="position:absolute;top:' + (first + i) * 30 + 'px;height:30px" onclick="document.body.dataset.picked=this.textContent">' + n + '</div>').join('')
}
list.addEventListener('scroll', render); render()
</script>`

test.describe('long drop-down lists', () => {
  test('the outline says an open list holds more options than it shows', async ({ page }) => {
    // a judged run read the first 9 options of « Type de page » and told the assistant the
    // catalogue it named was not in the list
    await page.setContent(VIRTUAL_LIST)
    const p = createPagePerception([{ label: 'page', root: page }])
    assert.match(await p.call('look', {}), /the list "Type de page" holds more options than it shows: scroll it/)
  })

  test('clicking an option out of sight scrolls the open list to it, as a person scans for it', async ({ page }) => {
    await page.setContent(VIRTUAL_LIST)
    const p = createPagePerception([{ label: 'page', root: page }])
    assert.equal(await p.call('click', { name: 'Catalogue d\'événements' }), 'clicked "Catalogue d\'événements"')
    assert.equal(await page.evaluate(() => document.body.dataset.picked), 'Catalogue d\'événements')
  })

  test('a list a few pixels too short for its options is not said to hold more', async ({ page }) => {
    // the note fired on the 6 fully visible options of « Type de lien », and the persona then
    // ignored it on the list that did hold more
    await page.setContent('<div role="listbox" aria-label="Type de lien" style="height:150px;overflow:auto"><div style="height:154px">6 options</div></div>')
    const p = createPagePerception([{ label: 'page', root: page }])
    assert.doesNotMatch(await p.call('look', {}), /holds more options/)
  })

  test('a name with other punctuation than the control\'s still finds the control, not text', async ({ page }) => {
    // a judged run's persona wrote « Page blanche – Commencer avec une page vide » with a dash
    // the card's name does not have; the click fell back to the chat's text of that name
    await page.setContent(`<p>Cliquez sur « Page blanche – Commencer avec une page vide »</p>
<button onclick="document.body.dataset.hit='card'"><strong>Page blanche</strong> Commencer avec une page vide</button>`)
    const p = createPagePerception([{ label: 'page', root: page }])
    assert.equal(await p.call('click', { name: 'Page blanche – Commencer avec une page vide' }), 'clicked "Page blanche – Commencer avec une page vide"')
    assert.equal(await page.evaluate(() => document.body.dataset.hit), 'card')
  })

  test('a name is matched exactly before it is matched as part of a longer one', async ({ page }) => {
    // a judged run's click on the « Page » field landed on the « Pages de portails » link of
    // the navigation, and threw away a half-configured menu item
    await page.setContent('<a href="#pages" onclick="document.body.dataset.hit=\'link\'">Pages de portails</a><label for="p">Page</label><select id="p" onclick="document.body.dataset.hit=\'select\'"><option>Agenda</option></select>')
    const p = createPagePerception([{ label: 'page', root: page }])
    assert.equal(await p.call('click', { name: 'Page' }), 'clicked "Page"')
    assert.equal(await page.evaluate(() => document.body.dataset.hit), 'select')
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
