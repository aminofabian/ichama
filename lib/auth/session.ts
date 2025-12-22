import crypto from 'crypto'
import { createSession, getSessionByToken, deleteSession as deleteSessionFromDb } from '../db/queries/sessions'
import { hashOTP } from './otp'

export const SESSION_DURATION_DAYS = 30
export const SESSION_DURATION_MS = SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export async function createUserSession(userId: string): Promise<string> {
  const token = generateSessionToken()
  const tokenHash = hashOTP(token)
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString()

  await createSession(userId, tokenHash, expiresAt)
  return token
}

export async function getSession(token: string) {
  const tokenHash = hashOTP(token)
  return getSessionByToken(tokenHash)
}

export async function deleteSession(token: string): Promise<void> {
  const tokenHash = hashOTP(token)
  const session = await getSessionByToken(tokenHash)
  if (session) {
    await deleteSessionFromDb(session.id)
  }
}

