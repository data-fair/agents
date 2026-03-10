import { createHash, randomBytes, createCipheriv, createDecipheriv } from 'node:crypto'

export type CipheredContent = { iv: string, alg: 'aes256', data: string }

export const getSecurityKey = (cipherPassword: string): Buffer => {
  const hash = createHash('sha256')
  hash.update(cipherPassword)
  return hash.digest()
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
