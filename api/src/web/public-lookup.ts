/**
 * A DNS lookup that refuses non public addresses, so an agent cannot reach the service's own network
 * (databases, other stack services, cloud metadata) through a public name that resolves privately.
 * Checked at resolution, so it holds for every redirect hop and against DNS rebinding.
 *
 * Same rules as @data-fair/lib-node's ssrf.ts (2.14+), whose `publicLookup` should replace this file
 * once the service upgrades lib-node. That upgrade is not standalone: it also switches the check on in
 * the lib-node axios instance the service uses to reach stack services (nhi, models), which then need
 * the private instance.
 */

import dns from 'node:dns'
import net from 'node:net'

const NON_PUBLIC: [string, number, 'ipv4' | 'ipv6'][] = [
  ['0.0.0.0', 8, 'ipv4'],
  ['10.0.0.0', 8, 'ipv4'],
  ['100.64.0.0', 10, 'ipv4'],
  ['127.0.0.0', 8, 'ipv4'],
  ['169.254.0.0', 16, 'ipv4'],
  ['172.16.0.0', 12, 'ipv4'],
  ['192.0.0.0', 24, 'ipv4'],
  ['192.0.2.0', 24, 'ipv4'],
  ['192.168.0.0', 16, 'ipv4'],
  ['198.18.0.0', 15, 'ipv4'],
  ['198.51.100.0', 24, 'ipv4'],
  ['203.0.113.0', 24, 'ipv4'],
  ['224.0.0.0', 4, 'ipv4'],
  ['240.0.0.0', 4, 'ipv4'],
  ['::', 128, 'ipv6'],
  ['::1', 128, 'ipv6'],
  ['fc00::', 7, 'ipv6'],
  ['fe80::', 10, 'ipv6'],
  ['ff00::', 8, 'ipv6'],
  ['2001:db8::', 32, 'ipv6']
]

const nonPublic = new net.BlockList()
for (const [address, prefix, family] of NON_PUBLIC) nonPublic.addSubnet(address, prefix, family)

/** A BlockList of exceptions, from IPs and CIDR ranges ("127.0.0.1", "10.1.0.0/16"). */
export const ipList = (entries: string[]): net.BlockList => {
  const list = new net.BlockList()
  for (const entry of entries) {
    const [address, prefix] = entry.trim().split('/')
    const family = net.isIP(address) === 6 ? 'ipv6' : net.isIP(address) === 4 ? 'ipv4' : undefined
    if (!family) throw new Error(`invalid IP address or range "${entry}"`)
    if (prefix === undefined) list.addAddress(address, family)
    else list.addSubnet(address, Number(prefix), family)
  }
  return list
}

/** SSRF_PUBLIC_IPS, as lib-node reads it: addresses to treat as public (an intranet source, dev). */
export const envPublicIps = (): string[] =>
  (process.env.SSRF_PUBLIC_IPS ?? '').split(',').map(s => s.trim()).filter(Boolean)

export const isPublicAddress = (address: string, publicIps: net.BlockList): boolean => {
  // an IPv4-mapped IPv6 address is the IPv4 address it carries
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(address)?.[1]
  const ip = mapped ?? address
  const family = net.isIP(ip) === 6 ? 'ipv6' : 'ipv4'
  return publicIps.check(ip, family) || !nonPublic.check(ip, family)
}

type LookupCallback = (err: NodeJS.ErrnoException | null, address?: string | dns.LookupAddress[], family?: number) => void

/** A `lookup` for http(s).Agent that fails the connection when the name resolves to any non public address. */
export const publicLookup = (publicIps: net.BlockList) =>
  (hostname: string, options: dns.LookupOptions, callback: LookupCallback) => {
    dns.lookup(hostname, { ...options, all: true }, (err, addresses) => {
      if (err) return callback(err)
      const refused = addresses.find(a => !isPublicAddress(a.address, publicIps))
      if (refused) {
        const error: NodeJS.ErrnoException = new Error(`connection to ${hostname} (${refused.address}) refused, it is not a public address`)
        error.code = 'ERR_SSRF_BLOCKED'
        return callback(error)
      }
      if (options.all) callback(null, addresses)
      else callback(null, addresses[0].address, addresses[0].family)
    })
  }
