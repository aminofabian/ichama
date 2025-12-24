import { NextRequest, NextResponse } from 'next/server'
import { generateOTP, hashOTP, OTP_EXPIRY_MINUTES } from '@/lib/auth/otp'
import { sendOTP } from '@/lib/auth/sms'
import { sendOTPViaWhatsApp } from '@/lib/auth/whatsapp'
import { createOTPCode, getOTPCode } from '@/lib/db/queries/otp-codes'
import { validateKenyanPhone, normalizePhone } from '@/lib/utils/phone'
import db from '@/lib/db/client'
import type { ApiResponse } from '@/lib/types/api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phoneNumber, purpose = 'signup', deliveryMethod = 'sms' } = body

    if (!phoneNumber) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Phone number is required' },
        { status: 400 }
      )
    }

    if (!validateKenyanPhone(phoneNumber)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid Kenyan phone number format' },
        { status: 400 }
      )
    }

    const normalizedPhone = normalizePhone(phoneNumber)

    // Skip rate limiting in development
    if (process.env.NODE_ENV === 'production') {
      const recentOTP = await getOTPCode(
        normalizedPhone,
        purpose as 'signup' | 'login' | 'password_reset' | 'phone_change'
      )

      if (recentOTP) {
        const createdAt = new Date(recentOTP.created_at)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

        if (createdAt > oneHourAgo) {
          const attempts = await db.execute({
            sql: `SELECT COUNT(*) as count FROM otp_codes 
                  WHERE phone_number = ? AND purpose = ? 
                  AND created_at > ?`,
            args: [normalizedPhone, purpose, oneHourAgo.toISOString()],
          })

          const count = (attempts.rows[0]?.count as number) || 0
          if (count >= 3) {
            return NextResponse.json<ApiResponse>(
              {
                success: false,
                error: 'Too many OTP requests. Please try again later.',
              },
              { status: 429 }
            )
          }
        }
      }
    }

    const code = generateOTP()
    const codeHash = hashOTP(code)
    const expiresAt = new Date(
      Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000
    ).toISOString()

    await createOTPCode({
      phoneNumber: normalizedPhone,
      codeHash,
      expiresAt,
      purpose: purpose as 'signup' | 'login' | 'password_reset' | 'phone_change',
    })

    if (deliveryMethod === 'whatsapp') {
      await sendOTPViaWhatsApp(normalizedPhone, code)
    } else {
      await sendOTP(normalizedPhone, code)
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: `OTP sent successfully via ${deliveryMethod === 'whatsapp' ? 'WhatsApp' : 'SMS'}`,
    })
  } catch (error) {
    console.error('OTP send error:', error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to send OTP. Please try again.',
      },
      { status: 500 }
    )
  }
}

