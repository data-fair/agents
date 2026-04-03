/**
 * Lightweight ESM-compatible debug logger (replaces the CJS `debug` package).
 * Reads `localStorage.debug` to decide which namespaces are enabled.
 * Supports `%s` (string), `%o`/`%O` (object) format specifiers.
 */
export default function Debug (namespace: string): (...args: unknown[]) => void {
  return (...args: unknown[]) => {
    let enabled = false
    try { enabled = !!(typeof localStorage !== 'undefined' && localStorage.debug && localStorage.debug.includes(namespace)) } catch {}
    if (!enabled) return
    const [fmt, ...rest] = args
    if (typeof fmt === 'string') {
      let i = 0
      const msg = fmt.replace(/%[sOo]/g, () => {
        const val = rest[i++]
        return typeof val === 'object' ? JSON.stringify(val) : String(val ?? '')
      })
      console.debug(`[${namespace}]`, msg, ...rest.slice(i))
    } else {
      console.debug(`[${namespace}]`, ...args)
    }
  }
}
