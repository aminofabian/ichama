export type UserStatus = 'active' | 'suspended' | 'deleted'
export type UserLanguage = 'en' | 'sw'

export interface User {
  id: string
  full_name: string
  phone_number: string
  email: string | null
  password_hash: string
  avatar_url: string | null
  status: UserStatus
  phone_verified_at: string | null
  email_verified_at: string | null
  preferred_language: UserLanguage
  last_login_at: string | null
  created_at: string
  updated_at: string
}

export interface Session {
  id: string
  user_id: string
  token_hash: string
  device_info: string | null
  ip_address: string | null
  expires_at: string
  created_at: string
}

export interface OTPCode {
  id: string
  user_id: string | null
  phone_number: string
  code: string
  purpose: 'signup' | 'login' | 'password_reset' | 'phone_change'
  attempts: number
  expires_at: string
  verified_at: string | null
  created_at: string
}

export interface PasswordResetToken {
  id: string
  user_id: string
  token_hash: string
  expires_at: string
  used_at: string | null
  created_at: string
}

