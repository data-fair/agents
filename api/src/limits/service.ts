/**
 * service.ts contains high level stateful functions (uses #mongo, #config and memory caches)
 *  it can be used from various router.ts or other service.ts
 * it is tested by api integration tests
 */

import type { AccountKeys } from '@data-fair/lib-express'
import mongo from '#mongo'
import config from '#config'
import type { Limits } from '#types'

const currentMonth = () => new Date().toISOString().slice(0, 7)

/** Read (lazily creating a defaults doc) the limits of an account. */
export async function getLimits (owner: AccountKeys): Promise<Limits> {
  let limits: Limits | null = await mongo.limits.findOne({ type: owner.type, id: owner.id }, { projection: { _id: 0 } })
  if (!limits) {
    limits = { type: owner.type, id: owner.id, name: owner.id, lastUpdate: new Date().toISOString(), defaults: true }
    try {
      await mongo.limits.insertOne(limits)
    } catch (err: any) {
      if (err.code !== 11000) throw err
    }
    delete (limits as any)._id
  }
  limits.ai_credits = limits.ai_credits ?? { consumption: 0 }
  if (limits.ai_credits.limit === undefined || limits.ai_credits.limit === null) limits.ai_credits.limit = config.defaultLimits.credits
  limits.ai_credits.consumption = limits.ai_credits.consumption ?? 0
  return limits
}

export async function getCreditInfo (owner: AccountKeys): Promise<{ limit: number, consumption: number }> {
  const limits = await getLimits(owner)
  return { limit: limits.ai_credits!.limit!, consumption: limits.ai_credits!.consumption! }
}

/** Called from recordUsage — keeps the customers-facing consumption counter in
 * sync with recorded usage. Stamps consumptionMonth so the monthly reset of
 * defaults docs never wipes a fresh counter. */
export async function incrementConsumption (owner: AccountKeys, credits: number): Promise<void> {
  if (!credits) return
  await mongo.limits.updateOne(
    { type: owner.type, id: owner.id },
    {
      $inc: { 'ai_credits.consumption': credits },
      $set: { lastUpdate: new Date().toISOString(), consumptionMonth: currentMonth() },
      $setOnInsert: { type: owner.type, id: owner.id, name: owner.id, defaults: true }
    },
    { upsert: true }
  )
}

/** Monthly renewal for self-managed (defaults) docs: customers resets pushed
 * docs on the subscription renewal day; docs it never touched renew on the
 * calendar month. Run daily from the cleanup loop — idempotent. */
export async function resetDefaultsConsumption (): Promise<void> {
  await mongo.limits.updateMany(
    { defaults: true, consumptionMonth: { $exists: true, $lt: currentMonth() } },
    { $set: { 'ai_credits.consumption': 0, consumptionMonth: currentMonth() } }
  )
}
