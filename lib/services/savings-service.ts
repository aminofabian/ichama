import { getSavingsAccount, createSavingsAccount, updateSavingsBalance, createSavingsTransaction } from '@/lib/db/queries/savings'
import { createWalletTransaction } from '@/lib/db/queries/wallet'
import type { SavingsTransactionReason } from '@/lib/types/financial'

export async function creditSavings(
  userId: string,
  amount: number,
  cycleId: string | null,
  reason: SavingsTransactionReason
): Promise<void> {
  // Get or create savings account
  let account = await getSavingsAccount(userId)
  if (!account) {
    account = await createSavingsAccount(userId)
  }

  // Update balance
  const newBalance = (account.balance || 0) + amount
  await updateSavingsBalance(account.id, newBalance)

  // Create savings transaction
  await createSavingsTransaction({
    user_id: userId,
    savings_account_id: account.id,
    cycle_id: cycleId,
    amount,
    type: 'credit',
    reason,
    balance_after: newBalance,
    notes: `Savings credit: ${reason}`,
  })

  // Create wallet transaction for savings credit
  await createWalletTransaction({
    user_id: userId,
    chama_id: null,
    cycle_id: cycleId,
    type: 'savings_credit',
    amount,
    direction: 'in',
    reference_type: 'savings',
    reference_id: account.id,
    description: `Savings credit: ${reason}`,
  })
}

export async function debitSavings(
  userId: string,
  amount: number,
  reason: SavingsTransactionReason
): Promise<void> {
  // Get savings account
  const account = await getSavingsAccount(userId)
  if (!account) {
    throw new Error('Savings account not found')
  }

  const currentBalance = account.balance || 0
  if (currentBalance < amount) {
    throw new Error('Insufficient savings balance')
  }

  // Update balance
  const newBalance = currentBalance - amount
  await updateSavingsBalance(account.id, newBalance)

  // Create savings transaction
  await createSavingsTransaction({
    user_id: userId,
    savings_account_id: account.id,
    cycle_id: null,
    amount,
    type: 'debit',
    reason,
    balance_after: newBalance,
    notes: `Savings debit: ${reason}`,
  })

  // Create wallet transaction for savings debit
  await createWalletTransaction({
    user_id: userId,
    chama_id: null,
    cycle_id: null,
    type: 'savings_debit',
    amount,
    direction: 'out',
    reference_type: 'savings',
    reference_id: account.id,
    description: `Savings debit: ${reason}`,
  })
}

