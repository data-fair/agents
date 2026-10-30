/**
 * Personas that calibrate the judge (docs/superpowers/specs/2026-10-30-concise-replies-design.md, goal 2).
 *
 * Run the same cases with each, and the judge must tell them apart: `bloated` pads every reply, `lossy` is
 * the shortest and drops what the person needed. A judge that rates `lossy` tight, or cannot separate
 * `bloated` from the default, is not measuring brevity. Picked with `SIM_PERSONA_VARIANT`, for
 * autonomous-agent cases only — the one surface whose persona the runner seeds; unset, the case runs its
 * own persona.
 */

export const PERSONA_VARIANTS = {
  bloated: 'You are a thorough data assistant. Before each step, explain in detail what you are about to do and why. After each tool call, describe what it returned. Explain your method. End every reply with a recap of everything you did and an offer of further help.',
  lossy: 'You are a data assistant who answers in one short sentence at most. Leave out dates, caveats and limitations, and never explain what an action will do before doing it.'
} as const

export function resolvePersonaVariant (env: { SIM_PERSONA_VARIANT?: string }): { name: string, persona: string } | undefined {
  const name = env.SIM_PERSONA_VARIANT?.trim()
  if (!name) return undefined
  if (!(name in PERSONA_VARIANTS)) throw new Error(`unknown persona variant: ${name} (have: ${Object.keys(PERSONA_VARIANTS).join(', ')})`)
  return { name, persona: PERSONA_VARIANTS[name as keyof typeof PERSONA_VARIANTS] }
}
