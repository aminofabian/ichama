export type CycleFrequency = 'weekly' | 'biweekly' | 'monthly'
export type CycleStatus = 'pending' | 'active' | 'paused' | 'completed' | 'cancelled'
export type CycleMemberStatus = 'active' | 'defaulted' | 'completed' | 'removed'

export interface Cycle {
  id: string
  chama_id: string
  name: string
  contribution_amount: number
  payout_amount: number
  savings_amount: number
  service_fee: number
  frequency: CycleFrequency
  total_periods: number
  current_period: number
  start_date: string | null
  end_date: string | null
  status: CycleStatus
  created_by: string
  created_at: string
  updated_at: string
}

export interface CycleMember {
  id: string
  cycle_id: string
  chama_member_id: string
  user_id: string
  assigned_number: number | null
  turn_order: number | null
  status: CycleMemberStatus
  joined_at: string
  custom_savings_amount: number | null // NULL = use cycle default
  hide_savings: number // 0 = visible, 1 = hidden from other members
}

