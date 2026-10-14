// tests/features/mcp-profiles/mcp-profiles.unit.spec.ts
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { profileRoots, includedBy, offeredRoots, treeState, withProfiles, type McpProfile } from '../../../shared/mcp-profiles.ts'

const vocabulary: McpProfile[] = [
  { name: 'catalog', title: 'Catalogue' },
  { name: 'read', includes: ['read_datasets', 'read_portals'] },
  { name: 'write', includes: ['write_datasets', 'write_portals'] },
  { name: 'manage', includes: ['manage_datasets'] },
  { name: 'read_datasets' }, { name: 'read_portals' },
  { name: 'write_datasets', includes: ['read_datasets'] }, { name: 'write_portals', includes: ['read_portals'] },
  { name: 'manage_datasets', includes: ['write_datasets'] }
]

test.describe('profile tree', () => {
  test('roots are the profiles nothing includes, in declared order', () => {
    assert.deepEqual(profileRoots(vocabulary).map(p => p.name), ['catalog', 'read', 'write', 'manage'])
  })
  test('inclusion is transitive and names the selected profile', () => {
    const implied = includedBy(vocabulary, ['manage_datasets'])
    assert.equal(implied.get('write_datasets'), 'manage_datasets')
    assert.equal(implied.get('read_datasets'), 'manage_datasets')
    assert.equal(implied.has('manage_datasets'), false)
    assert.equal(implied.has('read_portals'), false)
  })
  test('an umbrella implies its families and what they include', () => {
    const implied = includedBy(vocabulary, ['write'])
    assert.equal(implied.get('write_portals'), 'write')
    assert.equal(implied.get('read_portals'), 'write')
  })
  test('a cycle in includes does not loop', () => {
    assert.deepEqual([...includedBy([{ name: 'a', includes: ['b'] }, { name: 'b', includes: ['a'] }], ['a']).keys()], ['b'])
  })
  test('roots offered follow the role', () => {
    assert.deepEqual(offeredRoots(vocabulary, 'user'), ['catalog', 'read'])
    assert.deepEqual(offeredRoots(vocabulary, 'contrib'), ['catalog', 'read', 'write'])
    assert.deepEqual(offeredRoots(vocabulary, 'admin'), ['catalog', 'read', 'write', 'manage'])
    assert.deepEqual(offeredRoots(vocabulary, undefined), ['catalog', 'read', 'write', 'manage'])
  })
  test('roots unknown to the role table are offered to admins only', () => {
    const v = [...vocabulary, { name: 'experimental' }]
    assert.equal(offeredRoots(v, 'contrib').includes('experimental'), false)
    assert.equal(offeredRoots(v, 'admin').includes('experimental'), true)
  })
  test('tree state: checked, implied and offered', () => {
    const tree = treeState(vocabulary, ['write_portals', 'manage'], 'contrib')
    const write = tree.find(n => n.name === 'write')!
    assert.equal(write.checked, false)
    assert.equal(write.children.find(c => c.name === 'write_portals')!.checked, true)
    const read = tree.find(n => n.name === 'read')!
    assert.equal(read.children.find(c => c.name === 'read_portals')!.implied, 'write_portals')
    // a saved profile outside the role stays checked, so it can be unchecked
    const manage = tree.find(n => n.name === 'manage')!
    assert.equal(manage.offered, false)
    assert.equal(manage.checked, true)
  })
})

test.describe('withProfiles', () => {
  test('sorts and de-duplicates, so equal selections give one url', () => {
    assert.equal(withProfiles('http://mcp:8080/mcp-server/mcp', ['write', 'catalog', 'write']), 'http://mcp:8080/mcp-server/mcp?profiles=catalog%2Cwrite')
    assert.equal(withProfiles('http://mcp/mcp', ['catalog', 'write']), withProfiles('http://mcp/mcp', ['write', 'catalog']))
  })
  test('keeps the other query parameters', () => {
    assert.equal(withProfiles('http://mcp/mcp?x=1', ['read']), 'http://mcp/mcp?x=1&profiles=read')
  })
})
