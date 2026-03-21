import { resolve } from 'node:path'
import { session, errorHandler, createSiteMiddleware, createSpaMiddleware } from '@data-fair/lib-express/index.js'
import express from 'express'
import helmet from 'helmet'
import { uiConfig } from './ui-config.ts'
import settingsRouter from './settings/router.ts'
import adminRouter from './admin/router.ts'
import modelsRouter, { getModelsForOwner } from './models/router.ts'
import summaryRouter from './summary/router.ts'
import gatewayRouter from './gateway/router.ts'
import usageRouter from './usage/router.ts'
import mongo from '#mongo'
import config from '#config'

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

app.use(express.json({ limit: '1mb' }))

app.use('/api/admin', adminRouter)
app.use('/api/settings', settingsRouter)
app.use('/api/models', modelsRouter)
app.use('/api/gateway', gatewayRouter)
app.use('/api/summary', summaryRouter)
app.use('/api/usage', usageRouter)
app.use('/api/ping', (req, res) => res.send('ok'))

if (process.env.NODE_ENV === 'development') {
  app.delete('/api/test-env', async (req, res) => {
    getModelsForOwner.clear()
    await mongo.db.collection('settings').deleteMany({ 'owner.id': /^test/ })
    await mongo.db.collection('usage').deleteMany({ 'owner.id': /^test/ })
    res.send()
  })
}

app.use('/api', (req, res) => res.status(404).send('unknown api endpoint'))

app.use(await createSpaMiddleware(resolve(import.meta.dirname, '../../ui/dist'), uiConfig, {
  csp: { nonce: true, header: true },
  privateDirectoryUrl: config.privateDirectoryUrl
}))

app.use(errorHandler)
