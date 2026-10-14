import { resolve } from 'node:path'
import { session, errorHandler, createSiteMiddleware, createSpaMiddleware } from '@data-fair/lib-express/index.js'
import express from 'express'
import helmet from 'helmet'
import { uiConfig } from './ui-config.ts'
import settingsRouter from './settings/router.ts'
import adminRouter from './admin/router.ts'
import modelsRouter from './models/router.ts'
import catalogRouter from './catalog/router.ts'
import memoryRouter from './memory/router.ts'
import filesRouter from './files/router.ts'
import tasksRouter from './tasks/router.ts'
import autonomousAgentsRouter from './autonomous-agents/router.ts'
import autonomousAgentRuntimeRouter from './conversations/router.ts'
import nhiRouter from './nhi/router.ts'
import summaryRouter from './summary/router.ts'
import usageRouter from './usage/router.ts'
import reviewRouter from './review/router.ts'
import moderationRouter from './moderation/router.ts'
import limitsRouter from './limits/router.ts'
import { createTestEnvRouter } from './test-env/router.ts'
import { SPA_CSP_DIRECTIVES } from './spa-csp.ts'
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
app.use('/api/catalog', catalogRouter)
// tasks first: see tasks/router.ts
app.use('/api/autonomous-agents', tasksRouter)
app.use('/api/autonomous-agents', autonomousAgentsRouter)
app.use('/api/conversations', autonomousAgentRuntimeRouter)
app.use('/api/nhi', nhiRouter)
app.use('/api/summary', summaryRouter)
app.use('/api/usage', usageRouter)
app.use('/api/review', reviewRouter)
app.use('/api/memory', memoryRouter)
app.use('/api/files', filesRouter)
app.use('/api/moderation', moderationRouter)
app.use('/api/v1/limits', limitsRouter)
app.use('/api/ping', (req, res) => res.send('ok'))

if (process.env.NODE_ENV === 'development') app.use('/api/test-env', createTestEnvRouter())

app.use('/api', (req, res) => res.status(404).send('unknown api endpoint'))

app.use(await createSpaMiddleware(resolve(import.meta.dirname, '../../ui/dist'), uiConfig, {
  csp: { nonce: true, header: SPA_CSP_DIRECTIVES },
  privateDirectoryUrl: config.privateDirectoryUrl
}))

app.use(errorHandler)
