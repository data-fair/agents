import { scryptSync, randomBytes, createCipheriv, createDecipheriv } from 'node:crypto'

export type CipheredContent = { iv: string, alg: 'aes256', data: string }

const SCRYPT_SALT = 'data-fair-agents-cipher'

export const getSecurityKey = (cipherPassword: string): Buffer => {
  return scryptSync(cipherPassword, SCRYPT_SALT, 32, { N: 16384, r: 8, p: 1 })
}

export const cipher = (content: string, securityKey: Buffer): CipheredContent => {
  const initVector = randomBytes(16)
  const algo = 'aes256'
  const cipher = createCipheriv(algo, securityKey, initVector)
  let encryptedData = cipher.update(content, 'utf-8', 'hex')
  encryptedData += cipher.final('hex')
  return {
    iv: initVector.toString('hex'),
    alg: algo,
    data: encryptedData
  }
}

export const decipher = (cipheredContent: CipheredContent, securityKey: Buffer): string => {
  const decipher = createDecipheriv(cipheredContent.alg, securityKey, Buffer.from(cipheredContent.iv, 'hex'))
  let content = decipher.update(cipheredContent.data, 'hex', 'utf-8')
  content += decipher.final('utf8')
  return content
}
