import db from '../client'
import type { Session } from '../../types/user'

export async function createSession(
  userId: string,
  tokenHash: string,
  expiresAt: string
): Promise<Session> {
  const result = await db.execute({
    sql: `INSERT INTO sessions (user_id, token_hash, expires_at, created_at)
          VALUES (?, ?, ?, ?)`,
    args: [userId, tokenHash, expiresAt, new Date().toISOString()],
  })

  const session = await getSessionById(result.lastInsertRowid?.toString() || '')
  if (!session) {
    throw new Error('Failed to create session')
  }
  return session
}

async function getSessionById(id: string): Promise<Session | null> {
  const result = await db.execute({
    sql: 'SELECT * FROM sessions WHERE id = ?',
    args: [id],
  })

  if (result.rows.length === 0) {
    return null
  }

  return result.rows[0] as unknown as Session
}

export async function getSessionByToken(tokenHash: string): Promise<Session | null> {
  const result = await db.execute({
    sql: 'SELECT * FROM sessions WHERE token_hash = ? AND expires_at > ?',
    args: [tokenHash, new Date().toISOString()],
  })

  if (result.rows.length === 0) {
    return null
  }

  return result.rows[0] as unknown as Session
}

export async function deleteSession(id: string): Promise<void> {
  await db.execute({
    sql: 'DELETE FROM sessions WHERE id = ?',
    args: [id],
  })
}

export async function deleteUserSessions(userId: string): Promise<void> {
  await db.execute({
    sql: 'DELETE FROM sessions WHERE user_id = ?',
    args: [userId],
  })
}

