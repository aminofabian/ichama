export type ChamaType = 'savings' | 'merry_go_round' | 'hybrid'
export type ChamaStatus = 'active' | 'paused' | 'closed'
export type ChamaMemberRole = 'admin' | 'member'
export type ChamaMemberStatus = 'active' | 'removed' | 'left'
export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'cancelled'
export type JoinRequestStatus = 'pending' | 'approved' | 'rejected'

export interface Chama {
  id: string
  name: string
  description: string | null
  created_by: string
  chama_type: ChamaType
  status: ChamaStatus
  invite_code: string
  is_private: number
  max_members: number
  cover_image_url: string | null
  default_interest_rate: number
  created_at: string
  updated_at: string
}

export interface ChamaMember {
  id: string
  chama_id: string
  user_id: string
  role: ChamaMemberRole
  status: ChamaMemberStatus
  joined_at: string
  removed_at: string | null
  removed_by: string | null
}

export interface Invitation {
  id: string
  chama_id: string
  invited_by: string
  invited_phone: string | null
  invited_email: string | null
  invite_code: string
  status: InvitationStatus
  expires_at: string
  accepted_at: string | null
  created_at: string
}

export interface JoinRequest {
  id: string
  chama_id: string
  user_id: string
  status: JoinRequestStatus
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
}

