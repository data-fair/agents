/** The database the dev API writes to: MONGO_URL when the environment sets it, else api/config/development.js's. */
export const devMongoUrl = process.env.MONGO_URL || `mongodb://localhost:${process.env.MONGO_PORT}/data-fair-agents-development`
