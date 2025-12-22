export type SavingsTransactionType = 'credit' | 'debit'
export type SavingsTransactionReason =
  | 'contribution'
  | 'withdrawal'
  | 'bonus'
  | 'penalty'
  | 'adjustment'

export type WalletTransactionType =
  | 'contribution'
  | 'payout'
  | 'savings_credit'
  | 'savings_debit'
  | 'fee'
  | 'refund'

export type WalletTransactionDirection = 'in' | 'out'

export interface SavingsAccount {
  id: string
  user_id: string
  balance: number
  created_at: string
  updated_at: string
}

export interface SavingsTransaction {
  id: string
  user_id: string
  savings_account_id: string
  cycle_id: string | null
  amount: number
  type: SavingsTransactionType
  reason: SavingsTransactionReason
  balance_after: number
  reference_id: string | null
  notes: string | null
  created_at: string
}

export interface WalletTransaction {
  id: string
  user_id: string
  chama_id: string | null
  cycle_id: string | null
  type: WalletTransactionType
  amount: number
  direction: WalletTransactionDirection
  reference_type: string | null
  reference_id: string | null
  description: string | null
  created_at: string
}

