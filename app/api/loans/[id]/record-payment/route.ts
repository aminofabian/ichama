import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { getLoanById } from '@/lib/db/queries/loans'
import { calculateLoanBreakdown } from '@/lib/utils/loan-utils'
import { formatCurrency } from '@/lib/utils/format'
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

    // Get interest rate - use loan's interest_rate if set and > 0, otherwise get chama's default
    let interestRate: number
    if (loan.interest_rate !== null && loan.interest_rate !== undefined && loan.interest_rate > 0) {
      interestRate = loan.interest_rate
    } else {
      // Fetch chama's default interest rate for loans without interest set or with 0 interest
      const { getChamaById } = await import('@/lib/db/queries/chamas')
      const chama = await getChamaById(loan.chama_id)
      interestRate = chama?.default_interest_rate || 0
      console.log('[Record Payment] Using chama default interest rate:', {
        loanInterestRate: loan.interest_rate,
        chamaDefaultInterestRate: chama?.default_interest_rate,
        finalInterestRate: interestRate,
      })
    }
    
    const principalAmount = loan.amount
    const interestAmount = (principalAmount * interestRate) / 100
    const totalLoanAmount = principalAmount + interestAmount
    const currentPaid = loan.amount_paid || 0
    
    console.log('[Record Payment] Interest calculation:', {
      loanId: loan.id,
      loanInterestRate: loan.interest_rate,
      calculatedInterestRate: interestRate,
      principalAmount,
      interestAmount,
      totalLoanAmount,
      currentPaid,
      loanStatus: loan.status,
    })
    
    // Check if loan is actually fully paid (including interest)
    const isFullyPaid = currentPaid >= totalLoanAmount
    
    // Allow payments if:
    // 1. Loan is active or approved, OR
    // 2. Loan is marked as paid but actually not fully paid (status correction needed)
    if (loan.status !== 'active' && loan.status !== 'approved' && isFullyPaid) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Can only record payments for active or approved loans' },
        { status: 400 }
      )
    }
    
    // If loan is marked as paid but not actually fully paid, correct the status
    if (loan.status === 'paid' && !isFullyPaid) {
      const { updateLoanStatus } = await import('@/lib/db/queries/loans')
      await updateLoanStatus(loan.id, 'active')
    }
    
    // Calculate complete breakdown including penalty interest if overdue
    const breakdown = calculateLoanBreakdown(
      principalAmount,
      interestRate,
      currentPaid,
      loan.due_date
    )

    // Debug logging
    console.log('[Record Payment] Full breakdown:', {
      loanId: loan.id,
      loanStatus: loan.status,
      loanInterestRateInDB: loan.interest_rate,
      calculatedInterestRate: interestRate,
      principalAmount,
      interestAmount: breakdown.originalInterest,
      originalTotal: breakdown.originalTotal,
      currentPaid,
      totalOutstanding: breakdown.totalOutstanding,
      requestedAmount: amount,
      breakdown: {
        originalInterest: breakdown.originalInterest,
        originalTotal: breakdown.originalTotal,
        totalOutstanding: breakdown.totalOutstanding,
        penaltyInterest: breakdown.penaltyInterest,
      },
    })

    // Check if payment exceeds remaining amount (including penalty)
    if (amount > breakdown.totalOutstanding) {
      return NextResponse.json<ApiResponse>(
        { 
          success: false, 
          error: `Payment of ${formatCurrency(amount)} exceeds remaining amount of ${formatCurrency(breakdown.totalOutstanding)}. Maximum payment: ${formatCurrency(breakdown.totalOutstanding)}${breakdown.penaltyInterest > 0 ? ` (includes ${formatCurrency(breakdown.penaltyInterest)} penalty)` : ''}` 
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
