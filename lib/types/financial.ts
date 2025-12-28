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

export type LoanStatus = 'pending' | 'approved' | 'active' | 'paid' | 'defaulted' | 'cancelled'
export type LoanGuarantorStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

export interface Loan {
  id: string
  user_id: string
  chama_id: string
  amount: number
  status: LoanStatus
  interest_rate: number
  repayment_period_days: number | null
  due_date: string | null
  amount_paid: number
  approved_at: string | null
  approved_by: string | null
  disbursed_at: string | null
  paid_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface LoanGuarantor {
  id: string
  loan_id: string
  guarantor_user_id: string
  status: LoanGuarantorStatus
  approved_at: string | null
  rejected_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface LoanPayment {
  id: string
  loan_id: string
  amount: number
  payment_method: string | null
  reference_id: string | null
  notes: string | null
  created_at: string
}

