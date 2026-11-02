// Log fields of the account owning what an audit line is about, as data-fair names them. The actor
// (accountKey, userId…) comes from the implicit log context opened by session.middleware(); the owner is a
// different notion and uses the owner* names. Config-free: only plain values.

export type OwnerLike = { type: string, id: string, department?: string, name?: string }

export type OwnerLogFields = { ownerKey: string, ownerDep: string | undefined, ownerName: string | undefined }

// the 3 keys are always present, possibly undefined: pino drops undefined values from the line
export const ownerLogFields = (owner: OwnerLike): OwnerLogFields => ({
  ownerKey: owner.type + '.' + owner.id,
  ownerDep: owner.department || undefined,
  ownerName: owner.name || undefined
})
