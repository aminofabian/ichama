import { NextRequest, NextResponse } from 'next/server'
import { verifyPassword } from '@/lib/auth/password'
import { createUserSession } from '@/lib/auth/session'
import { setSessionCookie } from '@/lib/auth/cookies'
import { getUserByPhone } from '@/lib/db/queries/users'
import { normalizePhone } from '@/lib/utils/phone'
import type { ApiResponse } from '@/lib/types/api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phoneNumber, password } = body

    if (!phoneNumber || !password) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Phone number and password are required' },
        { status: 400 }
      )
    }

    const normalizedPhone = normalizePhone(phoneNumber)
    const user = await getUserByPhone(normalizedPhone)

    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid phone number or password' },
        { status: 401 }
      )
    }

    const isValid = await verifyPassword(password, user.password_hash)
    if (!isValid) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid phone number or password' },
        { status: 401 }
      )
    }

    const sessionToken = await createUserSession(user.id)
    const response = NextResponse.json<ApiResponse>({
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

    setSessionCookie(response, sessionToken)

    return response
  } catch (error) {
    console.error('Signin error:', error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to sign in. Please try again.',
      },
      { status: 500 }
    )
  }
}

