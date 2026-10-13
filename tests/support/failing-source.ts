import { Readable } from 'node:stream'

/**
 * A source that fails right after its first chunk: what a broken download looks like to the store.
 * It pushes once, so "mid-way" does not depend on I/O scheduling (a source pushing on every read would
 * spin forever against a mock whose every answer is a microtask).
 */
export const failingSource = () => {
  let pushed = false
  return new Readable({
    read () {
      if (pushed) return
      pushed = true
      this.push(Buffer.from('partial-'))
      setImmediate(() => this.destroy(new Error('the source broke')))
    }
  })
}
