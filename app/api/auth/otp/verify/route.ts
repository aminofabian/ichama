import { NextRequest, NextResponse } from 'next/server'
import { verifyOTP } from '@/lib/auth/otp'
import { getOTPCode, verifyOTPCode, incrementOTPAttempts } from '@/lib/db/queries/otp-codes'
import { normalizePhone } from '@/lib/utils/phone'
import { generateSessionToken } from '@/lib/auth/session'
import { hashOTP } from '@/lib/auth/otp'
import type { ApiResponse } from '@/lib/types/api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phoneNumber, code, purpose = 'signup' } = body

    if (!phoneNumber || !code) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Phone number and code are required' },
        { status: 400 }
      )
    }

    const normalizedPhone = normalizePhone(phoneNumber)
    const otpRecord = await getOTPCode(
      normalizedPhone,
      purpose as 'signup' | 'login' | 'password_reset' | 'phone_change'
    )

    if (!otpRecord) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid or expired OTP' },
        { status: 400 }
      )
    }

    if (otpRecord.verified_at) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'OTP already used' },
        { status: 400 }
      )
    }

    const expiresAt = new Date(otpRecord.expires_at)
    if (expiresAt < new Date()) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'OTP expired' },
        { status: 400 }
      )
    }

    if (otpRecord.attempts >= 3) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Too many attempts. Please request a new OTP.' },
        { status: 400 }
      )
    }

    const isValid = verifyOTP(code, otpRecord.code)
    if (!isValid) {
      await incrementOTPAttempts(otpRecord.id)
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid OTP code' },
        { status: 400 }
      )
    }

    await verifyOTPCode(otpRecord.id)

    const tempToken = generateSessionToken()
    const tempTokenHash = hashOTP(tempToken)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { otpToken: tempTokenHash },
      message: 'OTP verified successfully',
    })
  } catch (error) {
    console.error('OTP verify error:', error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to verify OTP. Please try again.',
      },
      { status: 500 }
    )
  }
}

