import db from '../client'
import type { SavingsAccount } from '../../types/financial'

export async function createSavingsAccount(userId: string): Promise<SavingsAccount> {
  const now = new Date().toISOString()
  const result = await db.execute({
    sql: `INSERT INTO savings_accounts (user_id, balance, created_at, updated_at)
          VALUES (?, 0, ?, ?)`,
    args: [userId, now, now],
  })

  const account = await getSavingsAccount(userId)
  if (!account) {
    throw new Error('Failed to create savings account')
  }
  return account
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

