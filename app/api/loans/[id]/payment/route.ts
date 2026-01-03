import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { getLoanById, addLoanPayment } from '@/lib/db/queries/loans'
import { getChamaMember } from '@/lib/db/queries/chama-members'
import { formatCurrency } from '@/lib/utils/format'
import { calculateLoanBreakdown } from '@/lib/utils/loan-utils'
import type { ApiResponse } from '@/lib/types/api'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id: loanId } = await params
    const body = await request.json()
    const { amount, notes } = body

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

    // Check if user is admin of the chama
    const member = await getChamaMember(loan.chama_id, user.id)
    if (!member || member.role !== 'admin') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'You are not authorized to update loan payments' },
        { status: 403 }
      )
    }

    if (loan.status !== 'active' && loan.status !== 'approved') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Can only record payments for active or approved loans' },
        { status: 400 }
      )
    }

    // Get interest rate - use loan's interest_rate if set, otherwise get chama's default
    let interestRate: number
    if (loan.interest_rate !== null && loan.interest_rate !== undefined && loan.interest_rate > 0) {
      interestRate = loan.interest_rate
    } else {
      // Fetch chama's default interest rate for loans without interest set or with 0 interest
      const { getChamaById } = await import('@/lib/db/queries/chamas')
      const chama = await getChamaById(loan.chama_id)
      interestRate = chama?.default_interest_rate || 0
    }

    const principalAmount = loan.amount
    const currentPaid = loan.amount_paid || 0

    // Calculate complete breakdown including penalty interest if overdue
    const breakdown = calculateLoanBreakdown(
      principalAmount,
      interestRate,
      currentPaid,
      loan.due_date
    )

    // Allow partial payments - check that we don't exceed the total outstanding (including interest and penalties)
    if (amount > breakdown.totalOutstanding) {
      return NextResponse.json<ApiResponse>(
        { 
          success: false, 
          error: `Payment of ${formatCurrency(amount)} exceeds remaining amount of ${formatCurrency(breakdown.totalOutstanding)}. Maximum payment: ${formatCurrency(breakdown.totalOutstanding)}${breakdown.penaltyInterest > 0 ? ` (includes ${formatCurrency(breakdown.penaltyInterest)} penalty)` : ''}` 
        },
        { status: 400 }
      )
    }

    // addLoanPayment already updates the loan amount_paid and status if fully paid
    await addLoanPayment({
      loan_id: loanId,
      amount,
      notes: notes || null,
    })

    // Get updated loan to return current status
    const updatedLoan = await getLoanById(loanId)
    const newPaid = updatedLoan?.amount_paid || 0

    // Calculate updated breakdown after payment
    const updatedBreakdown = calculateLoanBreakdown(
      principalAmount,
      interestRate,
      newPaid,
      loan.due_date
    )

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        message: 'Payment recorded successfully',
        amountPaid: newPaid,
        remainingAmount: updatedBreakdown.totalOutstanding,
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

