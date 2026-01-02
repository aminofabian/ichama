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

  const result = await (db.execute as any)({ sql, args })
  return result.rows as unknown as SavingsTransaction[]
}

export async function getSavingsTransactionByReference(
  referenceId: string,
  reason: 'contribution' | 'withdrawal' | 'bonus' | 'penalty' | 'adjustment'
): Promise<SavingsTransaction | null> {
  const result = await db.execute({
    sql: 'SELECT * FROM savings_transactions WHERE reference_id = ? AND reason = ? LIMIT 1',
    args: [referenceId, reason],
  })

  if (result.rows.length === 0) {
    return null
  }

  return result.rows[0] as unknown as SavingsTransaction
}

export async function getUserSavingsForChama(
  userId: string,
  chamaId: string
): Promise<number> {
  const result = await db.execute({
    sql: `SELECT 
            ch.id as chama_id,
            ch.chama_type,
            c.amount_paid,
            cy.payout_amount,
            cy.service_fee,
            COALESCE(cm.custom_savings_amount, cy.savings_amount) as member_savings_amount
          FROM contributions c
          INNER JOIN cycles cy ON c.cycle_id = cy.id
          INNER JOIN chamas ch ON cy.chama_id = ch.id
          LEFT JOIN cycle_members cm ON c.cycle_member_id = cm.id
          WHERE c.user_id = ? 
            AND c.status = 'confirmed'
            AND ch.id = ?`,
    args: [userId, chamaId],
  })

  let totalSavings = 0

  result.rows.forEach((row: any) => {
    const chamaType = row.chama_type
    const amountPaid = Number(row.amount_paid) || 0
    const payoutAmount = Number(row.payout_amount) || 0
    const serviceFee = Number(row.service_fee) || 0
    const memberSavingsAmount = Number(row.member_savings_amount) || 0

    const amountAfterFee = Math.max(0, amountPaid - serviceFee)

    if (chamaType === 'savings' || chamaType === 'hybrid') {
      let savingsAmount = 0

      if (chamaType === 'savings') {
        savingsAmount = amountAfterFee
      } else if (chamaType === 'hybrid') {
        const savingsFromPayment = Math.max(0, amountAfterFee - payoutAmount)
        savingsAmount = Math.min(memberSavingsAmount, savingsFromPayment)
      }

      totalSavings += savingsAmount
    }
  })

  return totalSavings
}
