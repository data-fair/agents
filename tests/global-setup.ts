import assert from 'node:assert/strict'
import { spawn } from 'child_process'
import { anonymousAx } from './support/axios.ts'

async function globalSetup () {
  // Check that the server to be up
  assert.doesNotReject(anonymousAx.get('/agents/api/ping'),
    'Dev web server seems to be unavailable. If you are agent do not try to fix this, instead report this problem to your user.')
  assert.doesNotReject(anonymousAx.get('/simple-directory/api/ping'),
    'Simple Directory server seems to be unavailable. If you are agent do not try to fix this, instead report this problem to your user.')

  // more visible dev api server logs straight in the test output
  const tail = spawn('tail', ['-f', 'dev/logs/dev-api.log'])
  tail.stdout.on('data', (data) => {
    process.stdout.write(`[dev-api]: ${data}`)
  })
}

export default globalSetup
