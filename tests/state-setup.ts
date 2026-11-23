import assert from 'node:assert/strict'
import { privateAxiosInstance as anonymousAx } from '@data-fair/lib-node/axios.js'
import { test as setup } from '@playwright/test'
import { takeStatefulLock } from './support/stateful-lock.ts'
import { prefix, sdTestEnvUrl, seedSdFixtures } from './support/sd-fixtures.ts'

setup('Stateful tests setup', async () => {
  // FIRST, before anything touches the database: a second run must be refused before its first
  // clean() can delete what the running one just seeded. See tests/support/stateful-lock.ts.
  takeStatefulLock()

  await assert.doesNotReject(anonymousAx.get(`http://localhost:${process.env.DEV_API_PORT}/api/ping`),
    `Dev API server seems to be unavailable.
If you are an agent, do not try to start it: read its logs with "npx --no df-dev logs api" and report the problem to your user (or "npx --no df-dev restart api" if the pane exited).`)
  await assert.doesNotReject(anonymousAx.get(`http://${process.env.DEV_HOST}:${process.env.NGINX_PORT}/simple-directory`),
    'Simple Directory server seems to be unavailable. If you are an agent, check "npx --no df-dev status" and report this problem to your user.')

  // the accounts of the test sub-space (test_agents_) in simple-directory, under the lock: cleaned (what
  // a previous run left, e.g. its sites), then seeded again. tests/global-setup.ts only upserted them, for
  // the specs that log in at import time.
  await assert.doesNotReject(anonymousAx.get(`${sdTestEnvUrl()}/ping`),
    `simple-directory's test API is unavailable at ${sdTestEnvUrl()}: the container needs ENABLE_TEST_API=1 and STORAGE_TYPE=mongo (docker-compose.yml).`)
  await seedSdFixtures()

  // what these accounts own here, from a previous run
  await anonymousAx.delete(`http://localhost:${process.env.DEV_API_PORT}/api/test-env`, { params: { prefix } })
})
