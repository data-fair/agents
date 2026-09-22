/**
 * Shared vocabulary for the stackable usage histograms: the dimensions the API
 * can break a period down by, the display order/labels of their values, and the
 * stable palette used to color the stacked layers.
 */

export type UsageDimension = 'owner' | 'modelRole' | 'model' | 'profile' | 'tokenType'

export interface UsageEntry {
  label: string
  cost: number
  breakdown?: Record<string, number>
}

// The API stores keys percent-encoded for Mongo field paths, but only decodes
// them on read; the UI always receives the original value.
const VALUE_ORDER: Partial<Record<UsageDimension, string[]>> = {
  modelRole: ['assistant', 'tools', 'summarizer', 'evaluator', 'moderator'],
  profile: ['admin', 'contrib', 'user', 'external', 'anonymous'],
  tokenType: ['input', 'cachedInput', 'output']
}

const TOKEN_TYPE_LABELS: Record<string, string> = {
  input: 'Input',
  cachedInput: 'Cached input',
  output: 'Output'
}

/**
 * Records stored before the breakdown was introduced carry no dimensions, so
 * their whole cost would otherwise disappear from the stacked chart. Keep them
 * as a trailing layer so the layers keep summing to the period totals.
 */
const UNATTRIBUTED = '__unattributed__'
const UNATTRIBUTED_COLOR = 'rgba(120, 120, 120, 0.6)'

export function formatBreakdownValue (dimension: UsageDimension, value: string): string {
  if (value === UNATTRIBUTED) return 'Unattributed'
  if (dimension === 'owner') {
    // 'organization/test1' → 'test1'
    const slash = value.indexOf('/')
    return slash === -1 ? value : value.slice(slash + 1)
  }
  if (dimension === 'tokenType') return TOKEN_TYPE_LABELS[value] ?? value
  if (dimension === 'modelRole' || dimension === 'profile') {
    return value.charAt(0).toUpperCase() + value.slice(1)
  }
  return value
}

function compareValues (dimension: UsageDimension, a: string, b: string): number {
  if (a === UNATTRIBUTED || b === UNATTRIBUTED) return a === b ? 0 : a === UNATTRIBUTED ? 1 : -1
  const order = VALUE_ORDER[dimension]
  if (order) {
    const ai = order.indexOf(a)
    const bi = order.indexOf(b)
    if (ai !== -1 || bi !== -1) return (ai === -1 ? order.length : ai) - (bi === -1 ? order.length : bi)
  }
  return formatBreakdownValue(dimension, a).localeCompare(formatBreakdownValue(dimension, b))
}

const PALETTE = [
  'rgba(25, 118, 210, 0.75)',
  'rgba(0, 137, 123, 0.75)',
  'rgba(245, 124, 0, 0.75)',
  'rgba(94, 53, 177, 0.75)',
  'rgba(198, 40, 40, 0.75)',
  'rgba(46, 125, 50, 0.75)',
  'rgba(2, 119, 189, 0.75)',
  'rgba(216, 27, 96, 0.75)',
  'rgba(0, 121, 107, 0.75)',
  'rgba(255, 160, 0, 0.75)',
  'rgba(69, 90, 100, 0.75)',
  'rgba(156, 39, 176, 0.75)'
]

/**
 * One dataset per dimension value, aligned on the entry labels, so chart.js
 * stacks them into one bar per label. Colors are assigned from the sorted value
 * list, so the same value keeps its color across charts and refetches.
 */
function attributedCost (entry: UsageEntry): number {
  return Object.values(entry.breakdown ?? {}).reduce((sum, value) => sum + value, 0)
}

export function breakdownDatasets (entries: UsageEntry[], dimension: UsageDimension) {
  const values = new Set<string>()
  for (const entry of entries) {
    for (const value of Object.keys(entry.breakdown ?? {})) values.add(value)
    // tolerance for the per-class credits, each rounded separately from the total
    if (entry.cost - attributedCost(entry) > Math.max(entry.cost, 1) * 1e-9) values.add(UNATTRIBUTED)
  }
  return Array.from(values)
    .sort((a, b) => compareValues(dimension, a, b))
    .map((value, index) => ({
      label: formatBreakdownValue(dimension, value),
      data: entries.map(entry => value === UNATTRIBUTED
        ? Math.max(entry.cost - attributedCost(entry), 0)
        : entry.breakdown?.[value] ?? 0),
      backgroundColor: value === UNATTRIBUTED ? UNATTRIBUTED_COLOR : PALETTE[index % PALETTE.length],
      borderRadius: 2
    }))
}
