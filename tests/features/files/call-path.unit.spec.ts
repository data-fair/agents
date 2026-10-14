/**
 * stateless unit tests of the call path every tool call goes through (spec §4.4): a path becomes a signed
 * URL for the call only; what the model and the record see keeps the path.
 */
import { test } from 'playwright/test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
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

  test('in code mode, a tool\'s codeExecute runs instead of its execute, through the same file handling', async () => {
    const sourced = { tool: target(() => 'text for the model'), server: 's', fileArgs: ['file'], codeExecute: async (args: any) => { received.push(args); return { rows: 2 } } }
    assert.deepEqual(await run(withCallPath(sourced, { files }, 'code'), { file: '/clean.csv', title: 't' }), { rows: 2 })
    assert.match(received[0].file, /^http:\/\/agents:8080\/api\/files\//)
    assert.equal(await run(withCallPath(sourced, { files }), { file: '/clean.csv', title: 't' }), 'text for the model')
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

  test('a file argument that is not a string is refused, and the target is never called; an absent one passes', async () => {
    const wrapped = withCallPath({ tool: target(() => 'imported'), server: 's', fileArgs: ['file'] }, { files })
    await assert.rejects(run(wrapped, { file: 42 }), /"42" is not a valid file path/)
    await assert.rejects(run(wrapped, { file: { url: 'http://evil' } }), /is not a valid file path/)
    assert.equal(received.length, 0)
    assert.equal(await run(wrapped, { title: 't' }), 'imported')
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
  const opened = (body: string) => ({ url: uri, contentType: 'text/csv', contentDisposition: 'attachment; filename="roads.csv"', contentLength: body.length, etag: '"r1"', body: Readable.from([Buffer.from(body)]) })
  const SHA = createHash('sha256').update('a,b\n').digest('hex')

  test('each link is fetched with its origin, stored, and the text names the stored files', async () => {
    const origins: any[] = []
    const openLink = async (link: any, origin: any) => { origins.push([link.uri, origin]); return opened('a,b\n') }
    const wrapped = withCallPath({ tool: target(() => linked), server: 's' }, { files, openLink })
    const text = await run(wrapped, {})
    assert.equal(text, `The file: /roads.csv\n\nSaved to your files: /roads.csv (text/csv, 4 B, sha256 ${SHA}, etag "r1"), /roads-2.csv (text/csv, 4 B, sha256 ${SHA}, etag "r1").`)
    assert.deepEqual(origins.map(([, origin]) => origin), [{ catalog: true, site: 'https://site.example' }, { catalog: true, site: 'https://site.example' }])
    assert.deepEqual((await files.list()).map(f => f.path).sort(), ['/roads-2.csv', '/roads.csv'])
  })

  test('in code mode, a link result is the stored file records and the rewritten text', async () => {
    const openLink = async () => opened('a,b\n')
    const out: any = await run(withCallPath({ tool: target(() => ({ ...linked, links: [linked.links[0]] })), server: 's' }, { files, openLink }, 'code'), {})
    assert.deepEqual(out.files, [{ file_path: '/roads.csv', mimeType: 'text/csv', size: 4, sha256: SHA, etag: '"r1"' }])
    assert.match(out.text, /\/roads\.csv/)
    assert.doesNotMatch(out.text, /https?:\/\//)
  })

  test('a link that cannot be saved leaves the call successful, and the result says which and why', async () => {
    const openLink = async () => { throw new Error('"https://x" is not under this agent\'s allowed URLs (none)') }
    const wrapped = withCallPath({ tool: target(() => linked), server: 's' }, { files, openLink })
    assert.equal(await run(wrapped, {}), 'The file: https://site.example/data-fair/api/v1/datasets/roads/raw\n\nCould not save the file linked as roads: "https://x" is not under this agent\'s allowed URLs (none)\nCould not save the file linked as roads: "https://x" is not under this agent\'s allowed URLs (none)')
  })

  test('an unnamed link is shown without its query, in the line and in the text', async () => {
    const presigned = { _agentsLinkResult: true, text: 'see https://site.example/f?sig=secret', links: [{ uri: 'https://site.example/f?sig=secret', name: '' }], catalog: false }
    const refuse = async () => { throw new Error('answered HTTP 403 for https://site.example/f?sig=secret') }
    const out = await run(withCallPath({ tool: target(() => presigned), server: 's' }, { files, openLink: refuse }), {})
    assert.equal(out, 'see https://site.example/f\n\nCould not save the file linked as https://site.example/f: answered HTTP 403 for https://site.example/f')
    assert.ok(!out.includes('secret'))
  })

  test('a later failure keeps the files already saved, each failure on its own line', async () => {
    let n = 0
    const second = async () => { if (n++) throw new Error('boom'); return opened('a,b\n') }
    const out = await run(withCallPath({ tool: target(() => linked), server: 's' }, { files, openLink: second }), {})
    assert.equal(out, `The file: /roads.csv\n\nSaved to your files: /roads.csv (text/csv, 4 B, sha256 ${SHA}, etag "r1").\nCould not save the file linked as roads: boom`)
    assert.deepEqual((await files.list()).map(f => f.path), ['/roads.csv'])
  })

  test('a save failure (cap, scope) is reported with the link it refers to, not thrown', async () => {
    const wrapped = withCallPath({ tool: target(() => ({ ...linked, links: [linked.links[0]] })), server: 's' }, { files: { ...files, save: async () => { throw new Error('over the cap') } } as any, openLink: async () => opened('a') })
    assert.match(await run(wrapped, {}), /\n\nCould not save the file linked as roads: over the cap$/)
  })

  test('a stopped turn is not reported as failed links', async () => {
    const ac = new AbortController()
    const openLink = async () => { ac.abort(); throw new Error('aborted') }
    await assert.rejects(withCallPath({ tool: target(() => linked), server: 's' }, { files, openLink }).execute!({}, { toolCallId: 't', messages: [], abortSignal: ac.signal } as any), /aborted/)
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
