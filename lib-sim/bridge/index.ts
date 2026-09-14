import { createServer } from './server.ts'

const port = Number(process.env.BRIDGE_PORT ?? 3194)
createServer({ port })
console.log(`claude-bridge listening on http://localhost:${port}`)
console.log('configure an "OpenAI Compatible" provider with this base URL + /v1 and Compatibility Mode = compatible')
