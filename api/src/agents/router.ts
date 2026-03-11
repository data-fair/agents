import { Router } from 'express'
import { listAgents } from './operations.ts'

const router = Router()
export default router

router.get('/', async (req, res, next) => {
  const agents = listAgents()
  res.json({ results: agents, count: agents.length })
})
