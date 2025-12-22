import crypto from 'crypto'

export const OTP_EXPIRY_MINUTES = parseInt(
  process.env.OTP_EXPIRY_MINUTES || '10',
  10
)

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export function hashOTP(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex')
}

export function verifyOTP(code: string, hash: string): boolean {
  const codeHash = hashOTP(code)
  return crypto.timingSafeEqual(
    Buffer.from(codeHash),
    Buffer.from(hash)
  )
}

