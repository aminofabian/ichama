import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { getLoanGuarantorById, updateLoanGuarantorStatus, getLoanById, getLoanGuarantors, updateLoanStatus } from '@/lib/db/queries/loans'
import { notifyUser } from '@/lib/services/notification-service'
import { formatCurrency } from '@/lib/utils/format'
import db from '@/lib/db/client'
import type { ApiResponse } from '@/lib/types/api'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; guarantorId: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id: loanId, guarantorId } = await params
    const body = await request.json()
    const { action } = body

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      )
    }

    const guarantee = await getLoanGuarantorById(guarantorId)
    if (!guarantee) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Guarantee not found' },
        { status: 404 }
      )
    }

    if (guarantee.loan_id !== loanId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Guarantee does not belong to this loan' },
        { status: 400 }
      )
    }

    if (guarantee.guarantor_user_id !== user.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'You are not authorized to confirm this guarantee' },
        { status: 403 }
      )
    }

    if (guarantee.status !== 'pending') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Guarantee has already been processed' },
        { status: 400 }
      )
    }

    const status = action === 'approve' ? 'approved' : 'rejected'
    await updateLoanGuarantorStatus(guarantorId, status)

    const loan = await getLoanById(loanId)
    if (!loan) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Loan not found' },
        { status: 404 }
      )
    }

    if (action === 'approve') {
      const allGuarantors = await getLoanGuarantors(loanId)
      const allApproved = allGuarantors.every((g) => g.status === 'approved')

      if (allApproved) {
        // Set due date if not already set (30 days from now)
        let dueDate = loan.due_date
        if (!dueDate) {
          const newDueDate = new Date()
          newDueDate.setDate(newDueDate.getDate() + 30)
          dueDate = newDueDate.toISOString()
          
          await db.execute({
            sql: `UPDATE loans SET due_date = ?, updated_at = ? WHERE id = ?`,
            args: [dueDate, new Date().toISOString(), loanId],
          })
        }

        await updateLoanStatus(loanId, 'approved')
        
        await notifyUser(loan.user_id, 'loan_requested', {
          title: 'Loan Approved',
          message: `Your loan request of ${formatCurrency(loan.amount)} has been approved by all guarantors`,
          chama_id: loan.chama_id,
          data: {
            loan_id: loanId,
            amount: loan.amount,
          },
        })
      }
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        message: `Guarantee ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      },
    })
  } catch (error) {
    console.error('Confirm guarantor error:', error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to confirm guarantee',
      },
      { status: 500 }
    )
  }
}

