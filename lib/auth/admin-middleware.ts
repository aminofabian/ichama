import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/auth/session'
import { getUserById } from '@/lib/db/queries/users'
import { normalizePhone } from '@/lib/utils/phone'

export interface AdminUser {
  id: string
  full_name: string
  phone_number: string
  role?: string
}

export async function requireAdmin(): Promise<AdminUser> {
  const cookieStore = await cookies()
  const token = cookieStore.get('merry_session')?.value

  if (!token) {
    redirect('/signin')
  }

  const session = await getSession(token)
  if (!session) {
    redirect('/signin')
  }

  const user = await getUserById(session.user_id)
  if (!user) {
    redirect('/signin')
  }

  // Check if user is super_admin
  // For now, we'll check if user has a role field set to 'super_admin'
  // In production, you might want to add a role field to the users table
  // For now, we can check by phone number or email, or add a role field
  // Let's check by checking if user.id or email matches admin config
  const adminEmails =
    process.env.ADMIN_EMAILS?.split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean) || []
  const adminPhones =
    process.env.ADMIN_PHONES?.split(',')
      .map((phone) => normalizePhone(phone.trim()))
      .filter(Boolean) || []

  // Normalize user's phone number for comparison
  const userPhoneNormalized = normalizePhone(user.phone_number)
  const userEmailNormalized = (user.email || '').toLowerCase().trim()

  const isAdmin =
    (user.email && adminEmails.includes(userEmailNormalized)) ||
    adminPhones.includes(userPhoneNormalized)

  // Debug logging (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log('[Admin Check]', {
      userId: user.id,
      userPhone: user.phone_number,
      userPhoneNormalized,
      userEmail: user.email,
      userEmailNormalized,
      adminPhones,
      adminEmails,
      isAdmin,
      status: user.status,
    })
  }

  // Also check if user has status 'active' (super admins shouldn't be suspended)
  if (!isAdmin || user.status !== 'active') {
    redirect('/dashboard')
  }

  return {
    id: user.id,
    full_name: user.full_name,
    phone_number: user.phone_number,
  }
}

