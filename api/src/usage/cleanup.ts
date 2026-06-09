import mongo from '#mongo'

export async function cleanupOldUsage (): Promise<void> {
  const now = new Date()

  // per-user daily records: keep 7 days
  const userDailyCutoff = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 7))
  const userDailyCutoffPeriod = `daily:${userDailyCutoff.toISOString().slice(0, 10)}`

  // per-user monthly records: keep current month only
  const userMonthlyCutoff = `monthly:${now.toISOString().slice(0, 7)}`

  // account-level daily records: keep 30 days
  const accountDailyCutoff = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 30))
  const accountDailyCutoffPeriod = `daily:${accountDailyCutoff.toISOString().slice(0, 10)}`

  // account-level monthly records: keep 12 months
  const accountMonthlyCutoff = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1))
  const accountMonthlyCutoffPeriod = `monthly:${accountMonthlyCutoff.toISOString().slice(0, 7)}`

  await Promise.all([
    // per-user daily: older than 7 days (pool aggregates excluded, kept like account-level)
    mongo.usage.deleteMany({
      userId: { $exists: true, $not: /^pool:/ },
      period: { $lt: userDailyCutoffPeriod, $regex: /^daily:/ }
    } as any),
    // per-user monthly: older than current month (pool aggregates excluded)
    mongo.usage.deleteMany({
      userId: { $exists: true, $not: /^pool:/ },
      period: { $lt: userMonthlyCutoff, $regex: /^monthly:/ }
    } as any),
    // account-level daily: older than 30 days
    mongo.usage.deleteMany({
      userId: { $exists: false },
      period: { $lt: accountDailyCutoffPeriod, $regex: /^daily:/ }
    } as any),
    // account-level monthly: older than 12 months
    mongo.usage.deleteMany({
      userId: { $exists: false },
      period: { $lt: accountMonthlyCutoffPeriod, $regex: /^monthly:/ }
    } as any),
    // pool aggregates daily: older than 30 days (account-level retention)
    mongo.usage.deleteMany({
      userId: { $regex: /^pool:/ },
      period: { $lt: accountDailyCutoffPeriod, $regex: /^daily:/ }
    } as any),
    // pool aggregates monthly: older than 12 months (account-level retention)
    mongo.usage.deleteMany({
      userId: { $regex: /^pool:/ },
      period: { $lt: accountMonthlyCutoffPeriod, $regex: /^monthly:/ }
    } as any)
  ])
}
