import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { getLoanById } from '@/lib/db/queries/loans'
import { getChamaMember } from '@/lib/db/queries/chama-members'
import db from '@/lib/db/client'
import { updateLoanStatus } from '@/lib/db/queries/loans'
import type { ApiResponse } from '@/lib/types/api'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { paymentId } = await params
    const body = await request.json()
    const { action } = body

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      )
    }

    // Get payment record
    const paymentResult = await db.execute({
      sql: 'SELECT * FROM loan_payments WHERE id = ?',
      args: [paymentId],
    })

    if (paymentResult.rows.length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      )
    }

    const payment = paymentResult.rows[0] as any

    if (payment.status !== 'pending') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Payment has already been processed' },
        { status: 400 }
      )
    }

    const loan = await getLoanById(payment.loan_id)
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
        { success: false, error: 'You are not authorized to approve payments' },
        { status: 403 }
      )
    }

    const now = new Date().toISOString()

    if (action === 'approve') {
      // Update payment status
      await db.execute({
        sql: `UPDATE loan_payments 
              SET status = 'approved', approved_by = ?, approved_at = ?
              WHERE id = ?`,
        args: [user.id, now, paymentId],
      })

      // Update loan amount_paid
      const currentPaid = loan.amount_paid || 0
      const newAmountPaid = currentPaid + payment.amount

      await db.execute({
        sql: `UPDATE loans SET amount_paid = ?, updated_at = ? WHERE id = ?`,
        args: [newAmountPaid, now, loan.id],
      })

      // If fully paid, update loan status
      if (newAmountPaid >= loan.amount) {
        await updateLoanStatus(loan.id, 'paid')
      }
    } else {
      // Reject payment
      await db.execute({
        sql: `UPDATE loan_payments 
              SET status = 'rejected', approved_by = ?, approved_at = ?
              WHERE id = ?`,
        args: [user.id, now, paymentId],
      })
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        message: `Payment ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      },
    })
  } catch (error) {
    console.error('Approve payment error:', error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to approve payment',
      },
      { status: 500 }
    )
  }
}

