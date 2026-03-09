import { resolve } from 'node:path'
import { session, errorHandler, createSiteMiddleware, createSpaMiddleware } from '@data-fair/lib-express/index.js'
import express from 'express'
import helmet from 'helmet'
import { uiConfig } from './ui-config.ts'
import settingsRouter from './settings/router.ts'
import modelsRouter, { getModelsForOwner } from './models/router.ts'
import agentsRouter from './agents/router.ts'
import mcpRouter from './mcp/router.ts'
import mongo from '#mongo'

export const app = express()

app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      // very restrictive by default, index.html of the UI will have custom rules defined in createSpaMiddleware
      // https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html#security-headers
      'frame-ancestors': ["'none'"],
      'default-src': ["'none'"]
    }
  }
}))

// no fancy embedded arrays, just string and arrays of strings in req.query
app.set('query parser', 'simple')
app.use(createSiteMiddleware('agents'))
app.use(session.middleware())

app.use(express.json())

app.use('/api/settings', settingsRouter)
app.use('/api/models', modelsRouter)
app.use('/api/agents', agentsRouter)
app.use('/api/mcp', mcpRouter)

if (process.env.NODE_ENV === 'development') {
  const nock = (await import('nock')).default

  nock('https://api.openai.com')
    .persist()
    .get('/v1/models')
    .matchHeader('authorization', (val: any) => val.startsWith('Bearer '))
    .reply(200, {
      data: [
        { id: 'gpt-4o', name: 'GPT-4o' },
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
        { id: 'gpt-5', name: 'GPT-5' }
      ]
    })

  app.delete('/api/test-env', async (req, res) => {
    getModelsForOwner.clear()
    await mongo.db.collection('settings').deleteMany({ 'owner.id': /^test/ })
    res.send()
  })
}

app.use('/api', (req, res) => res.status(404).send('unknown api endpoint'))

if (process.env.NODE_ENV !== 'development') {
  app.use(await createSpaMiddleware(resolve(import.meta.dirname, '../../ui/dist'), uiConfig, {
    csp: { nonce: true, header: true }
  }))
}

app.use(errorHandler)
