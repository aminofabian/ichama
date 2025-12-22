import db from '../client'
import type { OTPCode } from '../../types/user'

export async function createOTPCode(data: {
  phoneNumber: string
  codeHash: string
  expiresAt: string
  purpose?: 'signup' | 'login' | 'password_reset' | 'phone_change'
  userId?: string | null
}): Promise<OTPCode> {
  const result = await db.execute({
    sql: `INSERT INTO otp_codes (user_id, phone_number, code, purpose, expires_at, created_at)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [
      data.userId || null,
      data.phoneNumber,
      data.codeHash,
      data.purpose || 'signup',
      data.expiresAt,
      new Date().toISOString(),
    ],
  })

  const otp = await getOTPCodeById(result.lastInsertRowid?.toString() || '')
  if (!otp) {
    throw new Error('Failed to create OTP code')
  }
  return otp
}

async function getOTPCodeById(id: string): Promise<OTPCode | null> {
  const result = await db.execute({
    sql: 'SELECT * FROM otp_codes WHERE id = ?',
    args: [id],
  })

  if (result.rows.length === 0) {
    return null
  }

  return result.rows[0] as unknown as OTPCode
}

export async function getOTPCode(
  phoneNumber: string,
  purpose: 'signup' | 'login' | 'password_reset' | 'phone_change'
): Promise<OTPCode | null> {
  const result = await db.execute({
    sql: `SELECT * FROM otp_codes 
          WHERE phone_number = ? AND purpose = ? AND verified_at IS NULL
          ORDER BY created_at DESC
          LIMIT 1`,
    args: [phoneNumber, purpose],
  })

  if (result.rows.length === 0) {
    return null
  }

  return result.rows[0] as unknown as OTPCode
}

export async function verifyOTPCode(id: string): Promise<void> {
  await db.execute({
    sql: 'UPDATE otp_codes SET verified_at = ? WHERE id = ?',
    args: [new Date().toISOString(), id],
  })
}

export async function incrementOTPAttempts(id: string): Promise<void> {
  await db.execute({
    sql: 'UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ?',
    args: [id],
  })
}

export async function deleteExpiredOTPs(): Promise<void> {
  await db.execute({
    sql: 'DELETE FROM otp_codes WHERE expires_at < ?',
    args: [new Date().toISOString()],
  })
}

