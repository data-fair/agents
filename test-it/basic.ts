import { strict as assert } from 'node:assert'
import { it, describe, before, after } from 'node:test'
import 'dotenv/config'
import { startApiServer, stopApiServer, axios } from './utils/index.ts'

describe('agents', () => {
  before(startApiServer)
  after(stopApiServer)

  it('should respond to ping', async () => {
    const res = await axios().get('/api/ping')
    assert.equal(res.data, 'ok')
  })
})
