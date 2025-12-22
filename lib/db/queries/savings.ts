import { nanoid } from 'nanoid'
import db from '../client'
import type { SavingsAccount } from '../../types/financial'

export async function createSavingsAccount(userId: string): Promise<SavingsAccount> {
  const id = nanoid()
  const now = new Date().toISOString()

  await db.execute({
    sql: `INSERT INTO savings_accounts (id, user_id, balance, created_at, updated_at)
          VALUES (?, ?, 0, ?, ?)`,
    args: [id, userId, now, now],
  })

  return {
    id,
    user_id: userId,
    balance: 0,
    created_at: now,
    updated_at: now,
  } as SavingsAccount
}

export async function getSavingsAccount(userId: string): Promise<SavingsAccount | null> {
  const result = await db.execute({
    sql: 'SELECT * FROM savings_accounts WHERE user_id = ?',
    args: [userId],
  })

  if (result.rows.length === 0) {
    return null
  }

  return result.rows[0] as unknown as SavingsAccount
}

