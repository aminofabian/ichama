export type NotificationType =
  | 'contribution_reminder'
  | 'contribution_confirmed'
  | 'contribution_overdue'
  | 'payout_scheduled'
  | 'payout_sent'
  | 'payout_received'
  | 'cycle_started'
  | 'cycle_ended'
  | 'cycle_period_advanced'
  | 'member_joined'
  | 'member_left'
  | 'member_removed'
  | 'invite_received'
  | 'invite_accepted'
  | 'announcement'
  | 'dispute_update'
  | 'rating_changed'
  | 'loan_requested'
  | 'system'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  data: string | null
  chama_id: string | null
  read_at: string | null
  created_at: string
}

export interface Announcement {
  id: string
  chama_id: string
  created_by: string
  title: string
  message: string
  is_pinned: number
  created_at: string
}

