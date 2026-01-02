import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { getLoanById } from '@/lib/db/queries/loans'
import { calculateLoanBreakdown } from '@/lib/utils/loan-utils'
import db from '@/lib/db/client'
import { nanoid } from 'nanoid'
import type { ApiResponse } from '@/lib/types/api'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id: loanId } = await params
    const body = await request.json()
    const { amount, paymentMethod, referenceId, notes } = body

    if (!amount || amount <= 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Payment amount must be greater than 0' },
        { status: 400 }
      )
    }

    const loan = await getLoanById(loanId)
    if (!loan) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Loan not found' },
        { status: 404 }
      )
    }

    // Check if user owns this loan
    if (loan.user_id !== user.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'You can only record payments for your own loans' },
        { status: 403 }
      )
    }

    if (loan.status !== 'active' && loan.status !== 'approved') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Can only record payments for active or approved loans' },
        { status: 400 }
      )
    }

    const currentPaid = loan.amount_paid || 0
    const interestRate = loan.interest_rate || 0
    const principalAmount = loan.amount
    
    // Calculate complete breakdown including penalty interest if overdue
    const breakdown = calculateLoanBreakdown(
      principalAmount,
      interestRate,
      currentPaid,
      loan.due_date
    )

    // Check if payment exceeds remaining amount (including penalty)
    if (amount > breakdown.totalOutstanding) {
      return NextResponse.json<ApiResponse>(
        { 
          success: false, 
          error: `Payment exceeds remaining amount. Maximum payment: ${breakdown.totalOutstanding.toLocaleString()} KES${breakdown.penaltyInterest > 0 ? ` (includes ${breakdown.penaltyInterest.toLocaleString()} KES penalty)` : ''}` 
        },
        { status: 400 }
      )
    }

    // Create pending payment record
    const paymentId = nanoid()
    const now = new Date().toISOString()

    await db.execute({
      sql: `INSERT INTO loan_payments (
        id, loan_id, amount, payment_method, reference_id, notes, status, recorded_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
      args: [
        paymentId,
        loanId,
        amount,
        paymentMethod || null,
        referenceId || null,
        notes || null,
        user.id,
        now,
      ],
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        message: 'Payment recorded successfully. Waiting for admin approval.',
        paymentId,
        amount,
        remainingAmount: breakdown.totalOutstanding - amount,
      },
    })
  } catch (error) {
    console.error('Record loan payment error:', error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to record payment',
      },
      { status: 500 }
    )
  }
}

