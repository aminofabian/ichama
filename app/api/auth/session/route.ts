import { NextRequest, NextResponse } from 'next/server'
import { getSessionCookie } from '@/lib/auth/cookies'
import { getSession } from '@/lib/auth/session'
import { getUserById } from '@/lib/db/queries/users'
import type { ApiResponse } from '@/lib/types/api'

export async function GET(request: NextRequest) {
  try {
    const token = getSessionCookie(request)
    if (!token) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const session = await getSession(token)
    if (!session) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid session' },
        { status: 401 }
      )
    }

    const user = await getUserById(session.user_id)
    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        user: {
          id: user.id,
          full_name: user.full_name,
          phone_number: user.phone_number,
          email: user.email,
        },
      },
    })
  } catch (error) {
    console.error('Session error:', error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to get session',
      },
      { status: 500 }
    )
  }
}

