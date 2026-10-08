/**
 * The persona's page tools. The exclusion test is the important one: the design
 * deliberately withholds evaluate and raw selectors, because a persona that can
 * run JavaScript verifies what no person could — which would make verdicts
 * wrongly optimistic instead of wrongly pessimistic.
 */

import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { createPagePerception, settledRead, truncate, pruneSnapshot, SNAPSHOT_CAP, TABLE_ROWS_KEPT, ACTION_TIMEOUT_MS, MCP_SERVER_NAME } from '../../../lib-sim/page-perception.ts'

const fakeRoot = (snapshot: string, log: string[] = []) => ({
  locator: (sel: string) => ({ ariaSnapshot: async () => snapshot, click: async () => { log.push('click ' + sel) }, fill: async (t: string) => { log.push('fill ' + t) } }),
  getByRole: (role: string, opts: { name: string }) => ({ first: () => ({ click: async () => { log.push(`click ${role}:${opts.name}`) }, fill: async (t: string) => { log.push(`fill ${role}:${opts.name}=${t}`) }, count: async () => 1 }) }),
  getByText: (name: string) => ({ first: () => ({ click: async () => { log.push('clickText:' + name) }, count: async () => 1 }) }),
  getByLabel: (name: string) => ({ first: () => ({ fill: async (t: string) => { log.push(`fillLabel:${name}=${t}`) }, count: async () => 1 }) })
})

test.describe('the tool set', () => {
  test('exposes exactly the tools a person has', () => {
    // This is the guard on the design's core exclusion. Any new tool must be a
    // deliberate edit here, and evaluate/raw-selector/DOM access must never be
    // added. This exact assertion already catches any addition or rename.
    // press, screenshot and switch_tab were added deliberately: keys, colours and tabs
    // are things a person has, and judged runs failed for want of each.
    const p = createPagePerception([{ label: 'page', root: fakeRoot('- button "Send"') as any }])
    assert.deepEqual(p.toolNames.sort(), ['click', 'look', 'press', 'screenshot', 'switch_tab', 'type'])
  })

  test('names the mcp server so allowedTools can be derived', () => {
    assert.equal(MCP_SERVER_NAME, 'page')
  })
})

test.describe('snapshot truncation', () => {
  test('leaves a short snapshot alone', () => {
    assert.equal(truncate('- button "Send"'), '- button "Send"')
  })

  test('caps a long one and says it did', () => {
    const long = 'x'.repeat(SNAPSHOT_CAP + 500)
    const out = truncate(long)
    assert.ok(out.length < long.length)
    assert.ok(/\[truncated/.test(out), 'a reader must be able to tell the snapshot was cut')
  })

  test('keeps the end of the page, where dialogs are', () => {
    // Overlays are teleported to the end of the DOM, so a head-only cut hides
    // exactly the thing a person is being asked about. A judged run turned on
    // this: the persona clicked "Ajouter une colonne", its look was cut at the
    // same point before and after, and whether the dialog ever opened could not
    // be decided from the record at all.
    const body = 'a'.repeat(SNAPSHOT_CAP * 2)
    const out = truncate(`${body}\n- dialog "Ajouter une colonne"`)
    assert.ok(out.includes('dialog "Ajouter une colonne"'), 'the overlay at the end must survive')
    assert.ok(out.startsWith('aaa'), 'the top of the page must survive too')
  })

  test('never cuts inside a line, so a partial value cannot pass for a whole one', () => {
    const value = 'gymnase, salle de sport, piscine, bassin de natation, stade, terrain de sport, complexe sportif'
    const lines = Array.from({ length: 160 }, (_, i) => `  - text: ligne de remplissage numéro ${i}`)
    lines.splice(58, 0, `  - textbox "Termes de recherche associés": ${value}`)
    const out = truncate(lines.join('\n'))
    for (const line of out.split('\n')) {
      if (line.includes('Termes de recherche')) assert.ok(line.endsWith(value), `a cut line: ${line}`)
    }
    assert.match(out, /\[truncated: \d+ lines not shown\]/)
  })

  test('takes a per-root budget', () => {
    const text = Array.from({ length: 300 }, (_, i) => `- text: line ${i}`).join('\n')
    assert.ok(truncate(text, 8000).length > truncate(text).length)
    assert.ok(truncate(text, 8000).length <= 8000 + 60)
  })

  test('stays within a bounded budget', () => {
    const out = truncate('x'.repeat(SNAPSHOT_CAP * 5))
    assert.ok(out.length <= SNAPSHOT_CAP + 60, `budget exceeded: ${out.length}`)
  })
})

test.describe('observations', () => {
  test('records every call with the turn the runner stamped', async () => {
    const p = createPagePerception([{ label: 'page', root: fakeRoot('- button "Send"') as any }])
    p.setTurn(3)
    await p.call('look', {})
    assert.equal(p.observations.length, 1)
    assert.equal(p.observations[0].turn, 3)
    assert.equal(p.observations[0].tool, 'look')
    assert.ok(p.observations[0].result.includes('button "Send"'))
  })

  test('look spans every root, labelled, so a framed page is visible too', async () => {
    const p = createPagePerception([
      { label: 'page', root: fakeRoot('- heading "Host"') as any },
      { label: 'chat frame', root: fakeRoot('- button "Send"') as any }
    ])
    const out = await p.call('look', {})
    assert.ok(out.includes('Host'))
    assert.ok(out.includes('Send'))
    assert.ok(out.includes('chat frame'), 'each root is labelled so the persona knows what it is looking at')
  })

  test('the cap applies per root, not to the joined result, so a large first root cannot crowd out a second', async () => {
    // On a large host page the first root alone can exceed SNAPSHOT_CAP; a cap
    // on the joined string would then truncate the second root (e.g. an
    // embedded `## chat panel`) away entirely, with no marker hinting it was
    // ever there.
    const long = 'x'.repeat(SNAPSHOT_CAP + 500)
    const p = createPagePerception([
      { label: 'page', root: fakeRoot(long) as any },
      { label: 'chat panel', root: fakeRoot('- button "Send"') as any }
    ])
    const out = await p.call('look', {})
    assert.ok(out.includes('…[truncated'), 'the oversized first root is marked as cut')
    assert.ok(out.includes('## chat panel'), 'the second root is not crowded out')
    assert.ok(out.includes('button "Send"'), 'the second root is fully present')
  })

  test('look continues when one root fails, marking it unreadable', async () => {
    // A detached frame is a realistic failure. one root's snapshot fails, but
    // the persona still sees the other.
    const failingRoot = {
      locator: () => ({ ariaSnapshot: async () => { throw new Error('frame detached') } })
    }
    const p = createPagePerception([
      { label: 'broken', root: failingRoot as any },
      { label: 'working', root: fakeRoot('- button "Continue"') as any }
    ])
    const out = await p.call('look', {})
    assert.ok(out.includes('could not read'), 'the persona is told the first root is unreadable')
    assert.ok(out.includes('frame detached'), 'the error message explains why')
    assert.ok(out.includes('Continue'), 'the working root is still visible')
    assert.ok(out.includes('working'), 'the working root is labelled')
  })

  test('a failed action is recorded, not thrown, so the persona can react', async () => {
    const empty = {
      ...fakeRoot(''),
      getByRole: () => ({ first: () => ({ count: async () => 0, click: async () => { throw new Error('nope') } }) }),
      getByText: () => ({ first: () => ({ count: async () => 0 }) })
    }
    const p = createPagePerception([{ label: 'page', root: empty as any }])
    const out = await p.call('click', { name: 'Nothing' })
    assert.ok(/not find|no element/i.test(out), 'the persona is told it could not click, in words it can act on')
    assert.equal(p.observations.at(-1)?.tool, 'click')
  })

  test('click records actionability failures as observations, not exceptions', async () => {
    // The element is found (count: 1) but clicking fails (actionability timeout,
    // overlay, etc). This must be recorded and returned as a message, not thrown.
    const clickFails = {
      ...fakeRoot(''),
      getByRole: () => ({
        first: () => ({
          count: async () => 1,
          click: async () => { throw new Error('element is covered by another') }
        })
      })
    }
    const p = createPagePerception([{ label: 'page', root: clickFails as any }])
    const out = await p.call('click', { name: 'Send' })
    assert.ok(/could not click.*Send/i.test(out), 'failure is returned as a message')
    assert.ok(out.includes('covered'), 'the failure reason is included')
    assert.equal(p.observations.length, 1)
    assert.equal(p.observations[0].tool, 'click')
    assert.equal(p.observations[0].result, out)
  })

  test('type records fill failures as observations, not exceptions', async () => {
    // Similar to click: element found but fill fails (detached, covered, etc).
    const fillFails = {
      ...fakeRoot(''),
      getByRole: () => ({
        first: () => ({
          count: async () => 1,
          fill: async () => { throw new Error('element is no longer attached to the DOM') }
        })
      })
    }
    const p = createPagePerception([{ label: 'page', root: fillFails as any }])
    const out = await p.call('type', { name: 'Search', text: 'query' })
    assert.ok(/could not type.*Search/i.test(out), 'failure is returned as a message')
    assert.ok(out.includes('attached'), 'the failure reason is included')
    assert.equal(p.observations.length, 1)
    assert.equal(p.observations[0].tool, 'type')
    assert.equal(p.observations[0].result, out)
  })
})

test.describe('action timeouts', () => {
  // The design's own failure mode: an element Playwright calls stable-but-
  // unreachable hung a real run for 15 minutes because none of these three
  // calls had a timeout. These tests check the option is actually passed, not
  // just that the constant exists — a call that quietly omits `timeout` would
  // pass every other test here and still hang for real.

  test('look passes ACTION_TIMEOUT_MS to ariaSnapshot', async () => {
    let seenOpts: any
    const root = { locator: () => ({ ariaSnapshot: async (opts: any) => { seenOpts = opts; return 'ok' } }) }
    const p = createPagePerception([{ label: 'page', root: root as any }])
    await p.call('look', {})
    assert.deepEqual(seenOpts, { timeout: ACTION_TIMEOUT_MS })
  })

  test('click passes ACTION_TIMEOUT_MS to the element click', async () => {
    let seenOpts: any
    const root = {
      locator: () => ({ ariaSnapshot: async () => '' }),
      getByRole: () => ({ first: () => ({ count: async () => 1, click: async (opts: any) => { seenOpts = opts } }) }),
      getByText: () => ({ first: () => ({ count: async () => 0 }) })
    }
    const p = createPagePerception([{ label: 'page', root: root as any }])
    await p.call('click', { name: 'Send' })
    assert.deepEqual(seenOpts, { timeout: ACTION_TIMEOUT_MS })
  })

  test('type passes ACTION_TIMEOUT_MS to the element fill', async () => {
    let seenOpts: any
    const root = {
      locator: () => ({ ariaSnapshot: async () => '' }),
      getByRole: () => ({ first: () => ({ count: async () => 1, fill: async (_t: string, opts: any) => { seenOpts = opts } }) }),
      getByLabel: () => ({ first: () => ({ count: async () => 0 }) })
    }
    const p = createPagePerception([{ label: 'page', root: root as any }])
    await p.call('type', { name: 'Search', text: 'query' })
    assert.deepEqual(seenOpts, { timeout: ACTION_TIMEOUT_MS })
  })

  test('a timed-out click is recorded as an observation, not thrown', async () => {
    // Playwright reports an actionability timeout as a rejected promise whose
    // message names the timeout — this is what a real ACTION_TIMEOUT_MS trip
    // looks like from the caller's side.
    const root = {
      locator: () => ({ ariaSnapshot: async () => '' }),
      getByRole: () => ({
        first: () => ({
          count: async () => 1,
          click: async () => { throw new Error(`locator.click: Timeout ${ACTION_TIMEOUT_MS}ms exceeded.`) }
        })
      }),
      getByText: () => ({ first: () => ({ count: async () => 0 }) })
    }
    const p = createPagePerception([{ label: 'page', root: root as any }])
    // The call resolves — it does not reject — which is the point: a hang or a
    // throw here would never reach writeEvidence, leaving stale evidence on
    // disk to be mistaken for this run's result.
    const out = await p.call('click', { name: 'Send' })
    assert.match(out, /Timeout/)
    assert.equal(p.observations.length, 1)
    assert.equal(p.observations[0].result, out)
  })
})

test.describe('off-limits names', () => {
  // A spy root that records every finder call, so a test can assert a refusal
  // happens before any lookup — the point of the guard, not a side effect of it.
  const spyRoot = () => {
    const calls: string[] = []
    const root = {
      locator: (sel: string) => { calls.push('locator:' + sel); return { ariaSnapshot: async () => '' } },
      getByRole: (role: string, opts: { name: string }) => {
        calls.push(`getByRole:${role}:${opts.name}`)
        return { first: () => ({ count: async () => 1, click: async () => {}, fill: async () => {} }) }
      },
      getByText: (name: string) => {
        calls.push('getByText:' + name)
        return { first: () => ({ count: async () => 1, click: async () => {} }) }
      },
      getByLabel: (name: string) => {
        calls.push('getByLabel:' + name)
        return { first: () => ({ count: async () => 1, fill: async () => {} }) }
      }
    }
    return { root, calls }
  }

  test('click refuses an off-limits name, without ever looking the element up, and records the refusal', async () => {
    const { root, calls } = spyRoot()
    const p = createPagePerception([{ label: 'page', root: root as any }], { offLimits: ['Send'] })
    const out = await p.call('click', { name: 'Send' })
    assert.match(out, /not yours to operate/)
    assert.match(out, /reply with your message/)
    assert.deepEqual(calls, [], 'no finder was ever called — the refusal happens before lookup')
    assert.equal(p.observations.length, 1)
    assert.equal(p.observations[0].tool, 'click')
    assert.equal(p.observations[0].result, out)
  })

  test('type refuses an off-limits name, without ever looking the field up, and records the refusal', async () => {
    const { root, calls } = spyRoot()
    const p = createPagePerception([{ label: 'page', root: root as any }], { offLimits: ['Type your message...'] })
    const out = await p.call('type', { name: 'Type your message...', text: 'hello there' })
    assert.match(out, /not yours to operate/)
    assert.deepEqual(calls, [], 'no finder was ever called — the refusal happens before lookup')
    assert.equal(p.observations.length, 1)
    assert.equal(p.observations[0].tool, 'type')
    assert.equal(p.observations[0].result, out)
  })

  test('matching is case-insensitive and trimmed', async () => {
    const { root, calls } = spyRoot()
    const p = createPagePerception([{ label: 'page', root: root as any }], { offLimits: ['send'] })
    const out = await p.call('click', { name: '  SEND  ' })
    assert.match(out, /not yours to operate/)
    assert.deepEqual(calls, [])
  })

  test('a name that merely contains an off-limits word is still allowed through', async () => {
    // "Send" is off-limits; "Send report" is a different, legitimate button and
    // must not be caught by a substring match.
    const { root, calls } = spyRoot()
    const p = createPagePerception([{ label: 'page', root: root as any }], { offLimits: ['Send'] })
    const out = await p.call('click', { name: 'Send report' })
    assert.ok(!/not yours to operate/.test(out), 'a merely-containing name is not refused')
    assert.equal(out, 'clicked "Send report"')
    assert.ok(calls.length > 0, 'the click actually looked the element up')
  })

  test('with no offLimits, behaviour is unchanged', async () => {
    const { root, calls } = spyRoot()
    const p = createPagePerception([{ label: 'page', root: root as any }])
    const out = await p.call('click', { name: 'Send' })
    assert.equal(out, 'clicked "Send"')
    assert.ok(calls.length > 0, 'with no offLimits list, click looks the element up as before')
  })

  test('offLimits is exposed so the persona prompt can tell whether a refusal is real', () => {
    const { root } = spyRoot()
    assert.deepEqual(createPagePerception([{ label: 'page', root: root as any }]).offLimits, [])
    assert.deepEqual(createPagePerception([{ label: 'page', root: root as any }], { offLimits: ['Send'] }).offLimits, ['Send'])
  })
})

test.describe('click says what it actually hit', () => {
  // Playwright clicks any visible element, so the getByText fallback "succeeds"
  // on a paragraph. A recorded run had the persona click a path label twice,
  // get `clicked "..."` both times, and conclude the product was broken — and
  // the judge reported it as a product failure. The click is still allowed (a
  // person can click text, and text is often inside a clickable div); the result
  // just has to stop claiming a control was activated.
  const rootWith = (kind: 'button' | 'link' | 'text', log: string[] = []) => ({
    locator: () => ({ ariaSnapshot: async () => '' }),
    getByRole: (role: string) => ({
      first: () => ({ count: async () => (role === kind ? 1 : 0), click: async () => { log.push(`click ${role}`) } })
    }),
    getByText: () => ({ first: () => ({ count: async () => (kind === 'text' ? 1 : 0), click: async () => { log.push('click text') } }) }),
    getByLabel: () => ({ first: () => ({ count: async () => 0 }) })
  })

  test('reports a plain click for a real button', async () => {
    const p = createPagePerception([{ label: 'page', root: rootWith('button') as any }])
    assert.equal(await p.call('click', { name: 'Create' }), 'clicked "Create"')
  })

  test('reports a plain click for a real link', async () => {
    const p = createPagePerception([{ label: 'page', root: rootWith('link') as any }])
    assert.equal(await p.call('click', { name: 'Back' }), 'clicked "Back"')
  })

  test('says so when all it found was text, not a control', async () => {
    const p = createPagePerception([{ label: 'page', root: rootWith('text') as any }])
    const result = await p.call('click', { name: '/workflow/item-1' })
    assert.ok(/not a button or a link/.test(result), result)
    assert.ok(result.includes('/workflow/item-1'), result)
  })
})

test.describe('snapshot pruning', () => {
  // The shape of the dataset page where the persona asserted a filled field did not
  // exist: a table and a rich-text toolbar ahead of the metadata fields.
  const rows = Array.from({ length: 40 }, (_, i) => `      - row "Equipement ${i} Nantes Stade ${500 + i}":\n        - cell "Equipement ${i}"\n        - cell "Nantes"\n        - cell "Stade"\n        - cell "${500 + i}"`).join('\n')
  const toolbar = ['Gras', 'Italique', 'Titre', 'Citation', 'Liste à puce', 'Liste numérotée', 'Lien', 'Image', 'Tableau', 'Aperçu', 'Plein écran', 'Aide'].map(b => `      - button "${b}":\n        - img\n      - text: "|"`).join('\n')
  const page = [
    '- main:',
    '  - link "Jeux de données":',
    '    - /url: /data-fair/datasets',
    '  - img',
    '  - table:',
    '    - rowgroup:',
    '      - row "nom commune type capacite":',
    '        - columnheader "nom"',
    '        - columnheader "commune"',
    '    - rowgroup:',
    rows,
    '  - application:',
    '    - toolbar:',
    toolbar,
    '  - textbox "Termes de recherche associés": gymnase, piscine',
    // what follows the form on the real page, so the field sits in the middle
    '  - list "Permissions":',
    Array.from({ length: 60 }, (_, i) => `    - listitem: Permission ${i} accordée au rôle contributeur de l'organisation`).join('\n')
  ].join('\n')

  test('keeps a field below a long table and a toolbar within the cap', () => {
    assert.ok(page.length > SNAPSHOT_CAP * 1.5, 'the fixture must overflow the cap unpruned')
    assert.ok(!truncate(page).includes('Termes de recherche associés'))
    assert.ok(truncate(pruneSnapshot(page)).includes('Termes de recherche associés": gymnase, piscine'))
  })

  test('keeps every listed row by its name and counts the rest', () => {
    const out = pruneSnapshot(page)
    assert.ok(out.includes('- row "Equipement 0 Nantes Stade 500"'))
    assert.ok(!out.includes('cell "Equipement 0"'), 'cells repeat the row name')
    assert.equal((out.match(/- row "/g) ?? []).length, TABLE_ROWS_KEPT + 1)
    assert.ok(out.includes(`… ${40 - TABLE_ROWS_KEPT} more rows`))
  })

  test('folds a toolbar into one line and drops what names nothing', () => {
    const out = pruneSnapshot(page)
    assert.ok(out.includes('- toolbar: Gras, Italique, Titre'))
    assert.ok(!/- img$/m.test(out))
    assert.ok(!out.includes('/url:'))
    assert.ok(out.includes('- link "Jeux de données"\n'), 'a link that lost its only child loses its colon')
  })

  test('leaves a snapshot that is not an outline as it is', () => {
    assert.equal(pruneSnapshot('(could not read: timeout)'), '(could not read: timeout)')
  })
})

test.describe('a look after an action waits for the page to settle', () => {
  test('reads until two consecutive reads agree', async () => {
    const reads = ['- text: liste', '- text: liste', '- text: tableau', '- text: tableau']
    let i = 0
    // the first two reads agree at once: stable
    assert.equal(await settledRead(async () => reads[Math.min(i++, reads.length - 1)], { intervalMs: 1 }), '- text: liste')
    const moving = ['- text: liste', '- text: chargement', '- text: tableau', '- text: tableau']
    let j = 0
    assert.equal(await settledRead(async () => moving[Math.min(j++, moving.length - 1)], { intervalMs: 1 }), '- text: tableau')
  })

  test('gives up after its budget and returns the last read', async () => {
    let n = 0
    const out = await settledRead(async () => `- text: ${n++}`, { intervalMs: 5, maxMs: 30 })
    assert.match(out, /^- text: \d+$/)
  })

  test('only a look after a click or typing waits', async () => {
    let reads = 0
    const root = {
      locator: () => ({ ariaSnapshot: async () => { reads++; return '- button "OK"' } }),
      getByRole: () => ({ first: () => ({ click: async () => {}, fill: async () => {}, count: async () => 1 }) }),
      getByText: () => ({ first: () => ({ click: async () => {}, count: async () => 1 }) }),
      getByLabel: () => ({ first: () => ({ fill: async () => {}, count: async () => 1 }) })
    }
    const p = createPagePerception([{ label: 'page', root: root as any }])
    await p.call('look', {})
    assert.equal(reads, 1, 'a plain look reads once')
    await p.call('click', { name: 'OK' })
    await p.call('look', {})
    assert.equal(reads, 3, 'the look after a click reads until stable')
  })
})
