import { resolve } from 'node:path'
import { session, errorHandler, createSiteMiddleware, createSpaMiddleware } from '@data-fair/lib-express/index.js'
import express from 'express'
import helmet from 'helmet'
import { uiConfig } from './ui-config.ts'
import settingsRouter from './settings/router.ts'
import modelsRouter from './models/router.ts'

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

app.get('/api/ping', async (req, res) => {
  res.send('ok')
})

app.use('/api/settings', settingsRouter)
app.use('/api/models', modelsRouter)

app.use('/api', (req, res) => res.status(404).send('unknown api endpoint'))

if (process.env.NODE_ENV !== 'test') {
  app.use(await createSpaMiddleware(resolve(import.meta.dirname, '../../ui/dist'), uiConfig, {
    csp: { nonce: true, header: true }
  }))
}

app.use(errorHandler)
