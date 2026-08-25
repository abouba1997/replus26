import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto'

function key() {
  const secret =
    process.env.DOCUMENT_ENCRYPTION_KEY ||
    process.env.AUTH_SECRET ||
    process.env.BETTER_AUTH_SECRET ||
    ''
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('DOCUMENT_ENCRYPTION_KEY or AUTH_SECRET is required in production')
    }
    return createHash('sha256').update('replus-docs:replus-dev-key').digest()
  }
  return createHash('sha256').update(`replus-docs:${secret}`).digest()
}

export function encryptBuffer(data: Buffer) {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key(), iv)
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([Buffer.from('R1'), iv, tag, encrypted])
}

export function decryptBuffer(payload: Buffer) {
  if (payload.length < 30 || payload.subarray(0, 2).toString() !== 'R1') {
    return payload
  }
  const iv = payload.subarray(2, 14)
  const tag = payload.subarray(14, 30)
  const encrypted = payload.subarray(30)
  const decipher = createDecipheriv('aes-256-gcm', key(), iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(encrypted), decipher.final()])
}
