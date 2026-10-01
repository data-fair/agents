/**
 * The stateful half of the identity port: a configured agent acting as itself.
 *
 * Separate from operations.ts because `getAutonomousAgentSession` holds the session cache and reaches
 * `#config` — which means anything importing it cannot be unit tested, since importing `#config`
 * validates the whole deployment environment at import time. The pure half, including the
 * `SessionProvider` contract both implementations satisfy, is in operations.ts.
 */

import { getAutonomousAgentSession, type EnrolledAutonomousAgent } from '../nhi/service.ts'
import type { SessionProvider } from './operations.ts'

export { forwardedSessionProvider, type SessionProvider } from './operations.ts'

/** A configured agent acting as itself, through its own non-human identity. */
export const nhiSessionProvider = (autonomousAgent: EnrolledAutonomousAgent): SessionProvider =>
  async () => await getAutonomousAgentSession(autonomousAgent)
