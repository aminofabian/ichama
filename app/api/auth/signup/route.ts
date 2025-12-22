import { NextRequest, NextResponse } from 'next/server'
import { hashPassword } from '@/lib/auth/password'
import { createUserSession } from '@/lib/auth/session'
import { setSessionCookie } from '@/lib/auth/cookies'
import { getUserByPhone, createUser, markPhoneVerified } from '@/lib/db/queries/users'
import { getOTPCode } from '@/lib/db/queries/otp-codes'
import { createSavingsAccount } from '@/lib/db/queries/savings'
import { normalizePhone } from '@/lib/utils/phone'
import type { ApiResponse } from '@/lib/types/api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fullName, phoneNumber, password, otpToken, email } = body

    if (!fullName || !phoneNumber || !password || !otpToken) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    const normalizedPhone = normalizePhone(phoneNumber)
    const existingUser = await getUserByPhone(normalizedPhone)
    if (existingUser) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Phone number already registered' },
        { status: 400 }
      )
    }

    // Development bypass: accept dev tokens
    const isDevToken = process.env.NODE_ENV !== 'production' && otpToken.startsWith('dev-')
    
    if (!isDevToken) {
      // Include verified OTPs in the search
      const otpRecord = await getOTPCode(normalizedPhone, 'signup', true)
      if (!otpRecord || !otpRecord.verified_at) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'OTP not verified. Please verify OTP first.' },
          { status: 400 }
        )
      }
    }

    const passwordHash = await hashPassword(password)
    const user = await createUser({
      fullName,
      phoneNumber: normalizedPhone,
      passwordHash,
      email: email || null,
    })

    await markPhoneVerified(user.id)
    await createSavingsAccount(user.id)

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
    console.error('Signup error:', error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to create account. Please try again.',
      },
      { status: 500 }
    )
  }
}

