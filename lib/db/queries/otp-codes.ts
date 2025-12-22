import { nanoid } from 'nanoid'
import db from '../client'
import type { OTPCode } from '../../types/user'

export async function createOTPCode(data: {
  phoneNumber: string
  codeHash: string
  expiresAt: string
  purpose?: 'signup' | 'login' | 'password_reset' | 'phone_change'
  userId?: string | null
}): Promise<OTPCode> {
  const id = nanoid()
  const createdAt = new Date().toISOString()

  await db.execute({
    sql: `INSERT INTO otp_codes (id, user_id, phone_number, code, purpose, expires_at, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      data.userId || null,
      data.phoneNumber,
      data.codeHash,
      data.purpose || 'signup',
      data.expiresAt,
      createdAt,
    ],
  })

  return {
    id,
    user_id: data.userId || null,
    phone_number: data.phoneNumber,
    code: data.codeHash,
    purpose: data.purpose || 'signup',
    attempts: 0,
    expires_at: data.expiresAt,
    verified_at: null,
    created_at: createdAt,
  } as OTPCode
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
  purpose: 'signup' | 'login' | 'password_reset' | 'phone_change',
  includeVerified = false
): Promise<OTPCode | null> {
  const sql = includeVerified
    ? `SELECT * FROM otp_codes 
       WHERE phone_number = ? AND purpose = ?
       ORDER BY created_at DESC
       LIMIT 1`
    : `SELECT * FROM otp_codes 
       WHERE phone_number = ? AND purpose = ? AND verified_at IS NULL
       ORDER BY created_at DESC
       LIMIT 1`

  const result = await db.execute({
    sql,
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

