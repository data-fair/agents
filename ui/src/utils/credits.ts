/**
 * Usage is accounted in credits, not money: a request costs
 * the model's per-class prices (fresh input, cached input, output) applied to the
 * token counts, divided by the deployment's EUROS_PER_CREDIT peg.
 * Amounts are therefore small fractions, so keep enough significant digits to
 * distinguish them instead of rounding everything to 0.
 */
export function formatCredits (locale: string, amount: number): string {
  return new Intl.NumberFormat(locale, { maximumSignificantDigits: 3 }).format(amount)
}
