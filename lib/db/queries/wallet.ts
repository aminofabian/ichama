import { nanoid } from 'nanoid'
import db from '../client'
import type { WalletTransaction } from '@/lib/types/financial'

export interface CreateWalletTransactionData {
  user_id: string
  chama_id?: string | null
  cycle_id?: string | null
  type: 'contribution' | 'payout' | 'savings_credit' | 'savings_debit' | 'fee' | 'refund'
  amount: number
  direction: 'in' | 'out'
  reference_type?: string | null
  reference_id?: string | null
  description?: string | null
}

export async function createWalletTransaction(
  data: CreateWalletTransactionData
): Promise<WalletTransaction> {
  const id = nanoid()
  const now = new Date().toISOString()

  await db.execute({
    sql: `INSERT INTO wallet_transactions (
      id, user_id, chama_id, cycle_id, type, amount, direction,
      reference_type, reference_id, description, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      data.user_id,
      data.chama_id || null,
      data.cycle_id || null,
      data.type,
      data.amount,
      data.direction,
      data.reference_type || null,
      data.reference_id || null,
      data.description || null,
      now,
    ],
  })

  const transaction = await getWalletTransactionById(id)
  if (!transaction) {
    throw new Error('Failed to create wallet transaction')
  }
  return transaction
}

export async function getWalletTransactionById(
  id: string
): Promise<WalletTransaction | null> {
  const result = await db.execute({
    sql: 'SELECT * FROM wallet_transactions WHERE id = ?',
    args: [id],
  })

  if (result.rows.length === 0) {
    return null
  }

  return result.rows[0] as unknown as WalletTransaction
}

export async function getWalletTransactions(
  userId: string,
  filters?: {
    type?: string
    cycle_id?: string
    chama_id?: string
    start_date?: string
    end_date?: string
    limit?: number
  }
): Promise<WalletTransaction[]> {
  let sql = 'SELECT * FROM wallet_transactions WHERE user_id = ?'
  const args: unknown[] = [userId]

  if (filters?.type) {
    sql += ' AND type = ?'
    args.push(filters.type)
  }

  if (filters?.cycle_id) {
    sql += ' AND cycle_id = ?'
    args.push(filters.cycle_id)
  }

  if (filters?.chama_id) {
    sql += ' AND chama_id = ?'
    args.push(filters.chama_id)
  }

  if (filters?.start_date) {
    sql += ' AND created_at >= ?'
    args.push(filters.start_date)
  }

  if (filters?.end_date) {
    sql += ' AND created_at <= ?'
    args.push(filters.end_date)
  }

  sql += ' ORDER BY created_at DESC'

  if (filters?.limit) {
    sql += ' LIMIT ?'
    args.push(filters.limit)
  }

  const result = await (db.execute as any)({ sql, args })
  return result.rows as unknown as WalletTransaction[]
}

export async function getWalletBalance(userId: string): Promise<number> {
  const transactions = await getWalletTransactions(userId)

  return transactions.reduce((balance, tx) => {
    if (tx.direction === 'in') {
      return balance + tx.amount
    } else {
      return balance - tx.amount
    }
  }, 0)
}

