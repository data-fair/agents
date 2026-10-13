/**
 * router.ts contains the HTTP layer logic and stateful logic
 * it should not be imported anywhere else than app.ts
 * it is tested by api integration tests
 *
 * The one URL an MCP server fetches a file from (spec §4.3): signed, read-only, one file, no session, ≈10
 * minutes. Any instance answers: the store is shared. One upload path for both backends — S3 credentials
 * never leave this service, and an MCP server's FILE_URL_PREFIXES names only files.publicUrl.
 */
import { Router } from 'express'
import { pipeline } from 'node:stream/promises'
import { httpError } from '@data-fair/lib-express'
import config from '#config'
import { fileStore } from './service.ts'
import { checkFileSignature, fileKey, isStoredName, isValidScope, mimeTypeOf } from './operations.ts'

const router = Router()
export default router

router.get('/:ownerType/:ownerId/:scopeId/:name', async (req, res) => {
  const backend = fileStore()
  if (!backend || !config.files) throw httpError(404, 'no file store is configured')
  const { ownerType, ownerId, scopeId, name } = req.params
  const scope = { ownerType, ownerId, scopeId }
  // The same predicates that build keys: a path that could not have been signed is refused as such.
  if (!isValidScope(scope) || !isStoredName(name)) throw httpError(400, 'invalid file path')
  const check = checkFileSignature(config.files.secret, scope, name, req.query.exp, req.query.sig, Math.floor(Date.now() / 1000))
  if (check === 'invalid') throw httpError(403, 'invalid file URL signature')
  if (check === 'expired') throw httpError(403, 'this file URL has expired')

  const { body, size } = await backend.readStream(fileKey(scope, name))
  res.set({
    'content-type': mimeTypeOf(name),
    // Exact: data-fair answers 411 to a chunked upload, and openapi-mcp frames the multipart from it.
    'content-length': String(size),
    'content-disposition': `attachment; filename="${name}"`,
    'cache-control': 'private, no-store'
  })
  if (req.method === 'HEAD') { body.destroy(); res.end(); return }
  try {
    await pipeline(body, res)
  } catch (err) {
    console.error(`[files] streaming ${scopeId}/${name} failed`, err)
  }
})
