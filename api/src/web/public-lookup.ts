/**
 * A DNS lookup that refuses non public addresses, so an agent cannot reach the service's own network
 * (databases, other stack services, cloud metadata) through a public name that resolves privately.
 * Checked at resolution, so it holds for every redirect hop and against DNS rebinding.
 *
 * The rules are @data-fair/lib-node's (`ssrf.ts`): anything that is not plain unicast is refused, which
 * covers the IPv6 forms carrying an IPv4 address (NAT64, 6to4, Teredo) a hand-kept range list missed.
 * This file only adapts them to what the callers here need and lib-node does not export: rules built from
 * an explicit list (a test, a caller's own exceptions) rather than the environment alone, and a lookup
 * over them for undici, whose dispatchers the web readers, the file downloads and the external MCP servers
 * use. Stack services are reached with lib-node's private axios instance, never through this.
 */

import dns from 'node:dns'
import { Agent } from 'undici'
import { checkAddress, parseIPList, type SsrfRules } from '@data-fair/lib-node/ssrf.js'

/** The rules with these exceptions: IPs and CIDR ranges ("127.0.0.1", "10.1.0.0/16") treated as public. */
export const ipList = (entries: string[]): SsrfRules => ({
  publicIPs: parseIPList(entries.join(','), 'the public IP exceptions'),
  privateIPs: parseIPList(process.env.SSRF_PRIVATE_IPS, 'SSRF_PRIVATE_IPS')
})

/** SSRF_PUBLIC_IPS, as lib-node reads it: addresses to treat as public (an intranet source, dev). */
export const envPublicIps = (): string[] =>
  (process.env.SSRF_PUBLIC_IPS ?? '').split(',').map(s => s.trim()).filter(Boolean)

export const isPublicAddress = (address: string, rules: SsrfRules): boolean => !checkAddress(address, undefined, rules)

type LookupCallback = (err: NodeJS.ErrnoException | null, address?: string | dns.LookupAddress[], family?: number) => void

/** A `lookup` for http(s).Agent that fails the connection when the name resolves to any non public address. */
export const publicLookup = (rules: SsrfRules) =>
  (hostname: string, options: dns.LookupOptions, callback: LookupCallback) => {
    dns.lookup(hostname, { ...options, all: true }, (err, addresses) => {
      if (err) return callback(err)
      for (const { address } of addresses) {
        const refused = checkAddress(address, hostname, rules)
        if (refused) return callback(refused)
      }
      if (options.all) callback(null, addresses)
      else callback(null, addresses[0].address, addresses[0].family)
    })
  }

/**
 * An undici dispatcher that only connects to public addresses: the external MCP servers' connections and
 * the file downloads (api/src/files/download.ts). Its keep-alive sockets are its owner's to close.
 */
export const publicDispatcher = (publicIps: string[], opts: { headersTimeout?: number, bodyTimeout?: number } = {}): Agent =>
  new Agent({ ...opts, connect: { lookup: publicLookup(ipList(publicIps)) as any } })
