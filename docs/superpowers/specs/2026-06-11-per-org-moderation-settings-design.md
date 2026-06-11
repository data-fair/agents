# Per-org moderation settings

## Goal

Replace the hardwired moderation behavior with an org-level configuration:

- **Remove** the per-admin, per-browser self-test toggle that lets an admin opt
  their own requests into the moderation gate.
- **Add** an org-level setting (stored on `Settings`, alongside `storeTraces`):
  - a boolean to activate input moderation,
  - a multi-select of the user categories the gate applies to.

Moderation is **off by default**. Existing orgs get no moderation until an admin
activates it. The admin observability **probe** (activity page) is retained; only
the in-chat self-test toggle is removed.

## Background — current behavior

- The gateway runs the moderation gate when
  `identity.isUntrusted || identity.selfTestModeration`
  (`api/src/gateway/router.ts:164`). `isUntrusted` means role `anonymous` or
  `external`.
- `selfTestModeration` is an admin opt-in computed from the
  `x-moderation-self-test` header (`api/src/usage/operations.ts:isSelfTestModeration`,
  set in `api/src/usage/enforce.ts:60`). The browser sets the header from a
  `localStorage` flag toggled in the chat debug dialog.
- The strike-cooldown short-circuit (`gateway/router.ts:138`, `summary/router.ts:73`)
  is also gated on `isUntrusted`.
- The activity-page **probe** (`api/src/moderation/router.ts` → `runProbe` in
  `service.ts`) calls `generateObject` directly; it does **not** go through
  `startModeration` and is independent of the self-test mechanism.

## Approach

A nested `moderation: { enabled, categories[] }` object on `Settings`, plus a
pure `moderationApplies(settings, role)` helper used at every point where the
gate is currently decided. This groups the two related fields and mirrors the
proven `quotas` visibility pattern in the settings form.

Rejected alternatives: two flat top-level fields (scatters related config);
a per-role boolean map (overkill for five roles).

## Design

### 1. Settings schema — `api/types/settings/schema.js`

Add a `moderation` object to the top-level `properties`. Visibility is gated on
`parent.data.providers?.length`, exactly like `quotas` and `models`. Both
sub-fields render together inside the card; no sub-field is conditionally
hidden — this avoids the hidden-required-section + default spurious-diff trap
documented in the vjsf settings-form gotchas.

```js
moderation: {
  type: 'object',
  title: 'Input moderation',
  'x-i18n-title': { en: 'Input moderation', fr: 'Modération des entrées' },
  layout: { if: 'parent.data.providers?.length' },
  default: { enabled: false, categories: ['anonymous', 'external'] },
  required: ['enabled', 'categories'],
  properties: {
    enabled: {
      type: 'boolean',
      title: 'Enable input moderation',
      'x-i18n-title': { en: 'Enable input moderation', fr: 'Activer la modération des entrées' },
      description: 'When enabled, the last user message of each request from a moderated category is classified before the model responds.',
      'x-i18n-description': {
        en: 'When enabled, the last user message of each request from a moderated category is classified before the model responds.',
        fr: 'Si activé, le dernier message utilisateur de chaque requête provenant d\'une catégorie modérée est classé avant la réponse du modèle.'
      },
      default: false
    },
    categories: {
      type: 'array',
      uniqueItems: true,
      default: ['anonymous', 'external'],
      title: 'Moderated user categories',
      'x-i18n-title': { en: 'Moderated user categories', fr: 'Catégories d\'utilisateurs modérées' },
      items: {
        type: 'string',
        oneOf: [
          { const: 'anonymous', title: 'Anonymous', 'x-i18n-title': { en: 'Anonymous', fr: 'Anonyme' } },
          { const: 'external', title: 'External', 'x-i18n-title': { en: 'External', fr: 'Externe' } },
          { const: 'user', title: 'User', 'x-i18n-title': { en: 'User', fr: 'Utilisateur' } },
          { const: 'contrib', title: 'Contributor', 'x-i18n-title': { en: 'Contributor', fr: 'Contributeur' } },
          { const: 'admin', title: 'Admin', 'x-i18n-title': { en: 'Admin', fr: 'Administrateur' } }
        ]
      }
    }
  }
}
```

Then run `npm run build-types` to regenerate `#types`.

The settings **page** is schema-driven, so the moderation card appears
automatically — no Vue work on the settings page.

**Default category selection when an admin first enables**: `['anonymous',
'external']` (the untrusted pair). The selectable set is all five roles.

### 2. Persistence — `api/src/settings/router.ts` + `service.ts`

- Add `defaultModeration` to `service.ts` next to `defaultQuotas`:
  `{ enabled: false, categories: ['anonymous', 'external'] }`.
- In the PUT handler, persist `moderation: body.moderation ?? defaultModeration`
  (mirroring `quotas: body.quotas ?? defaultQuotas`).
- Add `moderation: defaultModeration` to `emptySettings`.

### 3. Decision helper — `api/src/moderation/operations.ts`

```js
export function moderationApplies (settings: Settings, role: string): boolean {
  return !!settings.moderation?.enabled && (settings.moderation.categories ?? []).includes(role)
}
```

Pure, no state — fits the operations.ts contract.

### 4. Gateway + summary wiring

- `gateway/router.ts:164`: replace `if (identity.isUntrusted || identity.selfTestModeration)`
  with `if (moderationApplies(settings, identity.role))`; drop the `selfTest` arg
  passed to `startModeration`.
- `gateway/router.ts:138`: the strike-cooldown short-circuit gates on
  `moderationApplies(settings, identity.role)` instead of `identity.isUntrusted`.
- `summary/router.ts:73`: same `moderationApplies(...)` gate for the cooldown check.
- `summary/router.ts:81`: **unchanged** — system-prompt pinning stays gated on
  `identity.isUntrusted`. It is a trust-boundary hardening (an untrusted caller's
  prompt is never trusted, regardless of the moderation toggle), not a moderation
  feature.

### 5. Remove the admin self-test

- `usage/enforce.ts`: remove the `selfTestModeration` field from `UsageIdentity`,
  its computation (line 60), and the `isSelfTestModeration` import.
- `usage/operations.ts`: delete `isSelfTestModeration`.
- `moderation/service.ts`: remove the now-unused `selfTest` param from
  `startModeration`; `finalize` always records the event and registers strikes.
  `runProbe` is untouched.
- UI:
  - `ui/src/components/AgentChat.vue`: remove `moderationSelfTestEnabled` ref,
    `handleModerationSelfTest`, and the props/listeners passed to the debug dialog.
  - `ui/src/components/AgentChatDebugDialog.vue`: remove the self-test toggle UI,
    prop, and emit.
  - `ui/src/composables/use-agent-chat.ts`: remove the `x-moderation-self-test`
    header lines (the `selfTest` localStorage read and the header it sets).

### 6. Widen role types

`user`/`contrib`/`admin` can now be moderated and will accrue events and strikes
uniformly (all keyed by `userId`). Widen:

- `moderation/types.ts`: `ModerationEvent.role` from `'anonymous' | 'external'`
  to the full `EffectiveRole`.
- `moderation/service.ts`: the `eventBase.role` cast and `recordStrikeRefusal`'s
  `role` cast, to match.

### 7. Tests

- API moderation tests: untrusted is no longer moderated by default. Tests must
  first PUT a settings doc with `moderation.enabled: true` and the relevant
  categories before expecting the gate. Add coverage:
  - moderation off → no gate even for anonymous/external.
  - moderation on, role in categories → gated.
  - moderation on, role **not** in categories → not gated.
- Remove self-test tests (`x-moderation-self-test` paths).
- Unit test for `moderationApplies`.

### 8. Docs

Update `docs/architecture/moderation.md`: moderation is opt-in per org with
configurable categories; the in-chat self-test is removed; the probe is retained.

## Out of scope

- No change to the moderation prompt, verdict schema, strike thresholds, caching,
  or the race/late-abort mechanics.
- No change to the activity-page observability section or the probe behavior.
- No output moderation / tool-result coverage (still v1 input-only).
