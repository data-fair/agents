/**
 * stateless unit tests of the call path every tool call goes through (spec §4.4): a path becomes a signed
 * URL for the call only; what the model and the record see keeps the path.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Readable } from 'node:stream'
import { tool, jsonSchema } from 'ai'
import { FsBackend } from '../../../api/src/files/fs.ts'
import { createTurnFiles, type TurnFiles } from '../../../api/src/files/turn-files.ts'
import { withCallPath, describeFileArguments } from '../../../api/src/files/call-path.ts'

let dir: string
let files: TurnFiles
const received: any[] = []
const target = (behaviour: (args: any) => any) => tool({
  description: 'imports a file',
  inputSchema: jsonSchema({ type: 'object', properties: { file: { type: 'string' }, title: { type: 'string' } } }),
  execute: async (args: any) => { received.push(args); return behaviour(args) }
})
const run = (t: any, input: any) => t.execute(input, { toolCallId: 't', messages: [] })

test.describe('withCallPath', () => {
  test.beforeEach(async () => {
    received.length = 0
    dir = await mkdtemp(join(tmpdir(), 'call-path-'))
    files = createTurnFiles({ backend: new FsBackend(dir), scope: { ownerType: 'organization', ownerId: 'test1', scopeId: 'c1' }, secret: 's'.repeat(32), publicUrl: 'http://agents:8080' })
    await files.writeText('/clean.csv', 'a,b\n')
  })
  test.afterEach(async () => { await rm(dir, { recursive: true, force: true }) })

  test('a file argument reaches the target as a signed URL; the caller\'s input is not changed', async () => {
    const wrapped = withCallPath({ tool: target(() => 'imported'), server: 's', fileArgs: ['file'] }, { files })
    const input = { file: '/clean.csv', title: 'Clean' }
    assert.equal(await run(wrapped, input), 'imported')
    assert.match(received[0].file, /^http:\/\/agents:8080\/api\/files\/organization\/test1\/c1\/clean\.csv\?exp=\d+&sig=/)
    assert.equal(received[0].title, 'Clean')
    assert.deepEqual(input, { file: '/clean.csv', title: 'Clean' })
  })

  test('a signed URL the server echoes is scrubbed back to the path, in results and in errors', async () => {
    const echoing = withCallPath({ tool: target(args => `fetched ${args.file}`), server: 's', fileArgs: ['file'] }, { files })
    assert.equal(await run(echoing, { file: '/clean.csv', title: 't' }), 'fetched /clean.csv')
    const failing = withCallPath({ tool: target(args => { throw new Error(`could not fetch ${args.file.split('?')[0]}: 403`) }), server: 's', fileArgs: ['file'] }, { files })
    await assert.rejects(run(failing, { file: '/clean.csv', title: 't' }), (err: any) => err.message === 'could not fetch /clean.csv: 403')
  })

  test('a missing file is a tool error naming the files that exist, and the target is never called', async () => {
    const wrapped = withCallPath({ tool: target(() => 'imported'), server: 's', fileArgs: ['file'] }, { files })
    await assert.rejects(run(wrapped, { file: '/gone.csv', title: 't' }), /There is no file named \/gone\.csv here\. Your files: \/clean\.csv\./)
    assert.equal(received.length, 0)
  })

  test('a tool without file arguments, or a turn without files, passes the input through', async () => {
    await run(withCallPath({ tool: target(() => 'ok'), server: 's' }, { files }), { file: '/clean.csv' })
    await run(withCallPath({ tool: target(() => 'ok'), server: 's', fileArgs: ['file'] }, {}), { file: '/clean.csv' })
    assert.deepEqual(received, [{ file: '/clean.csv' }, { file: '/clean.csv' }])
  })

  test('the approval card is told each file argument\'s path, type and size, or that it is missing', async () => {
    assert.deepEqual(await describeFileArguments(['file'], { file: '/clean.csv' }, files), { file: { path: '/clean.csv', mimeType: 'text/csv', size: 4 } })
    assert.deepEqual(await describeFileArguments(['file'], { file: '/gone.csv' }, files), { file: { path: '/gone.csv', missing: true } })
    assert.equal(await describeFileArguments(undefined, { file: '/clean.csv' }, files), undefined)
    assert.equal(await describeFileArguments(['file'], { file: '/clean.csv' }, undefined), undefined)
  })
})

test.describe('withCallPath — links', () => {
  test.beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'call-path-links-'))
    files = createTurnFiles({ backend: new FsBackend(dir), scope: { ownerType: 'organization', ownerId: 'test1', scopeId: 'c1' }, secret: 's'.repeat(32), publicUrl: 'http://agents:8080' })
  })
  test.afterEach(async () => { await rm(dir, { recursive: true, force: true }) })

  const uri = 'https://site.example/data-fair/api/v1/datasets/roads/raw'
  const linked = { _agentsLinkResult: true, text: `The file: ${uri}`, links: [{ uri, name: 'roads' }, { uri: `${uri}?again`, name: 'roads' }], catalog: true, site: 'https://site.example' }
  const opened = (body: string) => ({ url: uri, contentType: 'text/csv', contentDisposition: 'attachment; filename="roads.csv"', contentLength: body.length, body: Readable.from([Buffer.from(body)]) })

  test('each link is fetched with its origin, stored, and the text names the stored files', async () => {
    const origins: any[] = []
    const openLink = async (link: any, origin: any) => { origins.push([link.uri, origin]); return opened('a,b\n') }
    const wrapped = withCallPath({ tool: target(() => linked), server: 's' }, { files, openLink })
    const text = await run(wrapped, {})
    assert.equal(text, 'The file: /roads.csv\n\nSaved to your files: /roads.csv (text/csv, 4 B), /roads-2.csv (text/csv, 4 B).')
    assert.deepEqual(origins.map(([, origin]) => origin), [{ catalog: true, site: 'https://site.example' }, { catalog: true, site: 'https://site.example' }])
    assert.deepEqual((await files.list()).map(f => f.path).sort(), ['/roads-2.csv', '/roads.csv'])
  })

  test('a refused link fetch is a tool error with the reason', async () => {
    const openLink = async () => { throw new Error('"https://x" is not under this agent\'s allowed URLs (none)') }
    const wrapped = withCallPath({ tool: target(() => linked), server: 's' }, { files, openLink })
    await assert.rejects(run(wrapped, {}), /Could not save the file linked as "roads": "https:\/\/x" is not under this agent's allowed URLs \(none\)/)
  })

  test('without files, a link result is its text, unchanged', async () => {
    assert.equal(await run(withCallPath({ tool: target(() => linked), server: 's' }, {}), {}), `The file: ${uri}`)
  })
})

test.describe('withCallPath — errors carry no signed URL', () => {
  test.beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'call-path-err-'))
    files = createTurnFiles({ backend: new FsBackend(dir), scope: { ownerType: 'organization', ownerId: 'test1', scopeId: 'c1' }, secret: 's'.repeat(32), publicUrl: 'http://agents:8080' })
    await files.writeText('/clean.csv', 'a,b\n')
  })
  test.afterEach(async () => { await rm(dir, { recursive: true, force: true }) })

  test('the message, the stack and the cause of a thrown error are scrubbed', async () => {
    const failing = withCallPath({
      tool: target(args => { throw new Error(`bad ${args.file}`, { cause: new Error(`inner ${args.file}`) }) }),
      server: 's',
      fileArgs: ['file']
    }, { files })
    await assert.rejects(run(failing, { file: '/clean.csv' }), (err: any) => {
      const everything = `${err.message}\n${err.stack}\n${err.cause?.message}\n${err.cause?.stack}`
      assert.ok(!everything.includes('sig='), everything)
      assert.ok(!everything.includes('/api/files/'), everything)
      assert.equal(err.message, 'bad /clean.csv')
      return true
    })
  })
})
