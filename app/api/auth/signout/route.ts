import { NextRequest, NextResponse } from 'next/server'
import { getSessionCookie } from '@/lib/auth/cookies'
import { deleteSession } from '@/lib/auth/session'
import { clearSessionCookie } from '@/lib/auth/cookies'
import type { ApiResponse } from '@/lib/types/api'

export async function POST(request: NextRequest) {
  try {
    const token = getSessionCookie(request)
    if (token) {
      await deleteSession(token)
    }

    const response = NextResponse.json<ApiResponse>({
      success: true,
      message: 'Signed out successfully',
    })

    clearSessionCookie(response)
    return response
  } catch (error) {
    console.error('Signout error:', error)
    const response = NextResponse.json<ApiResponse>({
      success: true,
      message: 'Signed out successfully',
    })
    clearSessionCookie(response)
    return response
  }
}

