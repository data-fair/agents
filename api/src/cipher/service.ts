import config from '#config'
import { getSecurityKey } from './operations.ts'

// in-memory storage of the computed security key for optimization
export const securityKey = getSecurityKey(config.cipherPassword)
