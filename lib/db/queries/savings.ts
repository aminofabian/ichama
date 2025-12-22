import { nanoid } from 'nanoid'
import db from '../client'
import type { SavingsAccount, SavingsTransaction } from '../../types/financial'

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

export async function getSavingsAccountById(accountId: string): Promise<SavingsAccount | null> {
  const result = await db.execute({
    sql: 'SELECT * FROM savings_accounts WHERE id = ?',
    args: [accountId],
  })

  if (result.rows.length === 0) {
    return null
  }

  return result.rows[0] as unknown as SavingsAccount
}

export async function updateSavingsBalance(accountId: string, amount: number): Promise<SavingsAccount> {
  const now = new Date().toISOString()
  await db.execute({
    sql: `UPDATE savings_accounts SET balance = ?, updated_at = ? WHERE id = ?`,
    args: [amount, now, accountId],
  })

  const account = await getSavingsAccountById(accountId)
  if (!account) {
    throw new Error('Failed to update savings account balance')
  }
  return account
}

export async function createSavingsTransaction(data: {
  user_id: string
  savings_account_id: string
  cycle_id: string | null
  amount: number
  type: 'credit' | 'debit'
  reason: 'contribution' | 'withdrawal' | 'bonus' | 'penalty' | 'adjustment'
  balance_after: number
  reference_id?: string | null
  notes?: string | null
}): Promise<SavingsTransaction> {
  const id = nanoid()
  const now = new Date().toISOString()

  await db.execute({
    sql: `INSERT INTO savings_transactions (
      id, user_id, savings_account_id, cycle_id, amount, type, reason,
      balance_after, reference_id, notes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      data.user_id,
      data.savings_account_id,
      data.cycle_id,
      data.amount,
      data.type,
      data.reason,
      data.balance_after,
      data.reference_id || null,
      data.notes || null,
      now,
    ],
  })

  const transaction = await getSavingsTransactionById(id)
  if (!transaction) {
    throw new Error('Failed to create savings transaction')
  }
  return transaction
}

export async function getSavingsTransactionById(id: string): Promise<SavingsTransaction | null> {
  const result = await db.execute({
    sql: 'SELECT * FROM savings_transactions WHERE id = ?',
    args: [id],
  })

  if (result.rows.length === 0) {
    return null
  }

  return result.rows[0] as unknown as SavingsTransaction
}

export async function getSavingsTransactions(userId: string, limit?: number): Promise<SavingsTransaction[]> {
  let sql = 'SELECT * FROM savings_transactions WHERE user_id = ? ORDER BY created_at DESC'
  const args: unknown[] = [userId]

  if (limit) {
    sql += ' LIMIT ?'
    args.push(limit)
  }

  const result = await db.execute({ sql, args })
  return result.rows as unknown as SavingsTransaction[]
}
