/**
 * Usage is accounted in credits, not money: a request costs
 * (inputTokens + outputTokens × outputTokenWeight) / 1M × the model's multiplier.
 * Amounts are therefore small fractions, so keep enough significant digits to
 * distinguish them instead of rounding everything to 0.
 */
export function formatCredits (locale: string, amount: number): string {
  return new Intl.NumberFormat(locale, { maximumSignificantDigits: 3 }).format(amount)
}
