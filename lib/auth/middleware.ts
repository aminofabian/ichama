import { NextRequest } from 'next/server'
import { getSessionCookie } from './cookies'
import { getSession } from './session'
import { getUserById } from '../db/queries/users'
import type { User } from '../types/user'

export async function getAuthUser(request: NextRequest): Promise<User | null> {
  try {
    const token = getSessionCookie(request)
    if (!token) {
      return null
    }

    const session = await getSession(token)
    if (!session) {
      return null
    }

    const user = await getUserById(session.user_id)
    return user
  } catch (error) {
    console.error('getAuthUser error:', error)
    return null
  }
}

export async function requireAuth(request: NextRequest): Promise<User> {
  const user = await getAuthUser(request)
  if (!user) {
    throw new Error('Authentication required')
  }
  return user
}

