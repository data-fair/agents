import { MISSING_SDK_MESSAGE, isMissingSdkError } from '../missing-sdk.ts'

const port = Number(process.env.BRIDGE_PORT ?? 3194)

try {
  const { createServer } = await import('./server.ts')
  createServer({ port })
  console.log(`claude-bridge listening on http://localhost:${port}`)
  console.log('configure an "OpenAI Compatible" provider with this base URL + /v1 and Compatibility Mode = compatible')
} catch (err) {
  if (isMissingSdkError(err)) {
    console.error(MISSING_SDK_MESSAGE)
    process.exitCode = 1
  } else {
    throw err
  }
}
