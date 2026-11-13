/**
 * stateless unit tests for the removal of the tools model role: the stored-data migration
 * (upgrade/0.12.2) and the one-release tolerance of the role in the deployment config.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { stripToolsUsage } from '../../../upgrade/0.12.2/remove-tools-role.js'
import { dropRemovedModelRoles } from '../../../api/src/models/operations.ts'

const entry = (id: string, usage: string[]) => ({
  model: { id, name: id, provider: { type: 'openai', name: 'OpenAI', id: 'p1' } },
  usage,
  inputPricePerMillion: 1,
  outputPricePerMillion: 2
})

test.describe('stripToolsUsage', () => {
  test('pulls the role from an entry that has other usages, and drops an entry left with none', () => {
    const keep = entry('summary', ['summarizer'])
    const next = stripToolsUsage([entry('gpt-x', ['assistant', 'tools']), entry('tech', ['tools']), keep])
    assert.ok(next)
    assert.deepEqual(next.map(m => m.model.id), ['gpt-x', 'summary'])
    assert.deepEqual(next[0].usage, ['assistant'])
    assert.equal(next[0].inputPricePerMillion, 1, 'prices survive')
    assert.deepEqual(next[1], keep, 'an entry without the role is not rewritten')
  })

  test('returns null when no entry carries the role, so a second run writes nothing', () => {
    assert.equal(stripToolsUsage([entry('gpt-x', ['assistant'])]), null)
    assert.equal(stripToolsUsage(undefined as any), null)
    assert.equal(stripToolsUsage([{ model: { id: 'x' } } as any]), null)
  })
})

test.describe('dropRemovedModelRoles (deployment config)', () => {
  // The staging and production manifests' shape: the pod must start, not refuse the config.
  const ref = { provider: 'greenpt', id: 'flash' }
  const models = Object.freeze([
    Object.freeze({ provider: 'greenpt', id: 'flash', usage: Object.freeze(['assistant', 'tools']) }),
    Object.freeze({ provider: 'greenpt', id: 'only-tools', usage: Object.freeze(['tools']) }),
    Object.freeze({ provider: 'greenpt', id: 'small', usage: Object.freeze(['summarizer', 'moderator']) })
  ]) as any

  test('drops defaultModels.tools and the tools usage, without mutating node-config\'s frozen objects', () => {
    const out = dropRemovedModelRoles(Object.freeze({ assistant: ref, tools: ref }), models)
    assert.deepEqual(out.defaultModels, { assistant: ref })
    assert.deepEqual(out.models.map(m => [m.id, m.usage]), [['flash', ['assistant']], ['small', ['summarizer', 'moderator']]])
    assert.equal(out.dropped.length, 3)
    assert.ok(out.dropped.some(d => d.includes('only-tools') && d.includes('model dropped')))
  })

  test('reports nothing on a config that never named the role', () => {
    const out = dropRemovedModelRoles({ assistant: ref }, [models[2]])
    assert.deepEqual(out.dropped, [])
  })
})
