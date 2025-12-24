import { NextRequest, NextResponse } from 'next/server'
import { verifyPassword } from '@/lib/auth/password'
import { createUserSession } from '@/lib/auth/session'
import { setSessionCookie } from '@/lib/auth/cookies'
import { getUserByPhone, getUserByEmail } from '@/lib/db/queries/users'
import { getOTPCode } from '@/lib/db/queries/otp-codes'
import { normalizePhone } from '@/lib/utils/phone'
import type { ApiResponse } from '@/lib/types/api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phoneNumber, email, password, otpToken } = body

    if (otpToken) {
      if (!phoneNumber) {
      return NextResponse.json<ApiResponse>(
          { success: false, error: 'Phone number is required for OTP login' },
        { status: 400 }
      )
    }

    const normalizedPhone = normalizePhone(phoneNumber)
    const user = await getUserByPhone(normalizedPhone)

    if (!user) {
      return NextResponse.json<ApiResponse>(
          { success: false, error: 'User not found' },
          { status: 404 }
        )
      }

      const isDevToken = process.env.NODE_ENV !== 'production' && otpToken.startsWith('dev-')

      if (!isDevToken) {
        const otpRecord = await getOTPCode(normalizedPhone, 'login', true)
        if (!otpRecord || !otpRecord.verified_at) {
          return NextResponse.json<ApiResponse>(
            { success: false, error: 'OTP not verified. Please verify OTP first.' },
            { status: 400 }
          )
        }
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
    }

    if ((!phoneNumber && !email) || !password) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Phone number or email and password are required' },
        { status: 400 }
      )
    }

    let user = null
    if (phoneNumber) {
      const normalizedPhone = normalizePhone(phoneNumber)
      user = await getUserByPhone(normalizedPhone)
    } else if (email) {
      user = await getUserByEmail(email.toLowerCase().trim())
    }

    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const isValid = await verifyPassword(password, user.password_hash)
    if (!isValid) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid credentials' },
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

