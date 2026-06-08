# Untrusted pool quota — design

Date: 2026-06-08

## Problem

The quota system has two layers:

1. **Global** — a hard cap on total account usage (everyone combined, including legit members).
2. **Per-user role quotas** — each *individual* anonymous IP (`anonymous`) / external user (`external`) / org member is capped individually.

Nothing caps the *aggregate* of untrusted traffic. If `anonymous` = $10/IP and 1,000 IPs show up, the group can consume up to the global cap — which is shared with real members. Public/untrusted traffic can therefore starve the account's actual users.

## Goal

Add a **group-level aggregate cap** over untrusted users — anonymous and external combined into a single "untrusted" pool — sitting between the per-user limits and the global cap.

Decisions taken during brainstorming:
- **Scope:** one combined pool (anonymous + external summed together).
- **Layering:** keep both layers. A request must pass per-user AND pool AND global.

## Data model

Reuse the existing `usage` collection with a sentinel `userId` value `pool:untrusted`, mirroring the existing `anon:<iphash>` convention.

Every untrusted request (anonymous *or* external) increments, as today, its per-user record and the account aggregate (`userId` absent) — **plus** the `pool:untrusted` aggregate. Enforcement reads it back with the existing `getUsage(owner, 'pool:untrusted')` and runs it through the existing `checkQuota`.

`monthlyLimit` of `0` means "no group cap" (consistent with other limits) → backwards-compatible: existing accounts get no pool cap until an admin sets one.

## Config / schema

Add one new quota entry `untrusted` (a standard `RoleQuota`: `unlimited` + `monthlyLimit`), representing the combined anonymous+external budget. UI title: **"Anonymous + external pool"**.

- `api/types/settings/schema.js`: add `untrusted` to `quotas.properties`, the `required` list, the `default` block, and the layout `children` (a card, shown for both user and org accounts).
- `defaultQuotas` in `api/src/settings/router.ts` and `api/src/usage/router.ts`: add `untrusted: { unlimited: false, monthlyLimit: 0 }`.

## Enforcement & deduplication

Enforcement is currently copy-pasted in `api/src/gateway/router.ts` and `api/src/summary/router.ts`. Extract the shared logic into `api/src/usage/enforce.ts`:

- `resolveUsageIdentity(req, owner, quotas, authenticated)` → performs the anonymous-token / `assertCanUseModel` / `assertRoleQuota` gating; returns `{ trackPerUser, usageUserId, usageUserName, isUntrusted }` where `isUntrusted = !authenticated || role === 'external'`.
- `enforceQuotas(owner, quotas, identity)` → runs checks in order **per-user → untrusted pool (if `isUntrusted`) → global**; returns `QuotaExceeded | null`.

Each router keeps shaping its own 429 response from the result (gateway's rich body; summary's `{ error: reason }`) — no behavior change, just deduplication. The pool check lives in one place.

`recordUsage` gains one optional param `poolId?: string`; when set, it upserts the `pool:<id>` aggregate the same way it already upserts the account aggregate. Routers pass `'untrusted'` when `isUntrusted`.

## Loose ends

- **History:** `getUsersDailyHistory` filters out `userId` starting with `pool:` (not a real user).
- **Cleanup:** `cleanup.ts` keeps `pool:*` records on the account-level retention schedule (30d/12mo), not the 7-day per-user one.

## Tests

- Unit: `enforceQuotas` ordering + pool math; `checkQuota` already covered.
- API: two distinct anonymous IPs together exceed the pool cap and get 429 even though neither hit its per-user limit.
