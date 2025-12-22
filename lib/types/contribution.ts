export type ContributionStatus =
  | 'pending'
  | 'paid'
  | 'confirmed'
  | 'late'
  | 'missed'
  | 'partial'

export type PayoutStatus = 'scheduled' | 'pending' | 'paid' | 'confirmed' | 'skipped'

export interface Contribution {
  id: string
  cycle_id: string
  cycle_member_id: string
  user_id: string
  period_number: number
  amount_due: number
  amount_paid: number
  due_date: string
  paid_at: string | null
  confirmed_by: string | null
  confirmed_at: string | null
  status: ContributionStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Payout {
  id: string
  cycle_id: string
  cycle_member_id: string
  user_id: string
  period_number: number
  amount: number
  status: PayoutStatus
  scheduled_date: string | null
  paid_at: string | null
  paid_by: string | null
  confirmed_by_member: number
  confirmed_at: string | null
  notes: string | null
  created_at: string
}

export interface Default {
  id: string
  cycle_id: string
  cycle_member_id: string
  user_id: string
  period_number: number
  contribution_id: string | null
  reason: string
  penalty_amount: number
  penalty_points: number
  resolved: number
  resolved_at: string | null
  resolved_by: string | null
  created_at: string
}

