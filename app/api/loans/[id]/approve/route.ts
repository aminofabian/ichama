import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { getLoanById, updateLoanStatus, getLoanGuarantors } from '@/lib/db/queries/loans'
import { getChamaMember } from '@/lib/db/queries/chama-members'
import { notifyUser } from '@/lib/services/notification-service'
import { formatCurrency } from '@/lib/utils/format'
import type { ApiResponse } from '@/lib/types/api'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id: loanId } = await params
    const body = await request.json()
    const { action } = body

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid action. Must be "approve" or "reject"' },
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

    const member = await getChamaMember(loan.chama_id, user.id)
    if (!member || member.role !== 'admin') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'You are not authorized to approve this loan' },
        { status: 403 }
      )
    }

    if (loan.status !== 'pending') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Loan has already been processed' },
        { status: 400 }
      )
    }

    if (action === 'approve') {
      const guarantors = await getLoanGuarantors(loanId)
      const allApproved = guarantors.every((g) => g.status === 'approved')

      if (!allApproved) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'All guarantors must approve before the loan can be approved' },
          { status: 400 }
        )
      }

      await updateLoanStatus(loanId, 'approved', user.id)

      await notifyUser(loan.user_id, 'loan_requested', {
        title: 'Loan Approved',
        message: `Your loan request of ${formatCurrency(loan.amount)} has been approved by the admin`,
        chama_id: loan.chama_id,
        data: {
          loan_id: loanId,
          amount: loan.amount,
        },
      })
    } else {
      await updateLoanStatus(loanId, 'cancelled')

      await notifyUser(loan.user_id, 'loan_requested', {
        title: 'Loan Rejected',
        message: `Your loan request of ${formatCurrency(loan.amount)} has been rejected`,
        chama_id: loan.chama_id,
        data: {
          loan_id: loanId,
          amount: loan.amount,
        },
      })
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        message: `Loan ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      },
    })
  } catch (error) {
    console.error('Approve loan error:', error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to approve loan',
      },
      { status: 500 }
    )
  }
}

