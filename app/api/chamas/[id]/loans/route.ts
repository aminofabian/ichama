import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { getChamaById } from '@/lib/db/queries/chamas'
import { getChamaMember } from '@/lib/db/queries/chama-members'
import { getLoanGuarantors } from '@/lib/db/queries/loans'
import { getUserById } from '@/lib/db/queries/users'
import db from '@/lib/db/client'
import type { ApiResponse } from '@/lib/types/api'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id: chamaId } = await params

    const chama = await getChamaById(chamaId)
    if (!chama) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Chama not found' },
        { status: 404 }
      )
    }

    const member = await getChamaMember(chamaId, user.id)
    if (!member) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'You are not a member of this chama' },
        { status: 403 }
      )
    }

    // Get all loans for this chama
    const loansResult = await db.execute({
      sql: `SELECT * FROM loans WHERE chama_id = ? ORDER BY created_at DESC`,
      args: [chamaId],
    })

    const loans = loansResult.rows as any[]

    // Get pending payments for all loans
    const pendingPaymentsResult = await db.execute({
      sql: `SELECT lp.*, l.user_id as borrower_id 
            FROM loan_payments lp
            INNER JOIN loans l ON lp.loan_id = l.id
            WHERE l.chama_id = ? AND lp.status = 'pending'
            ORDER BY lp.created_at DESC`,
      args: [chamaId],
    })

    const pendingPayments = pendingPaymentsResult.rows as any[]

    // Enrich loans with borrower and guarantor details
    const loansWithDetails = await Promise.all(
      loans.map(async (loan: any) => {
        const borrower = await getUserById(loan.user_id)
        const guarantors = await getLoanGuarantors(loan.id)
        const guarantorDetails = await Promise.all(
          guarantors.map(async (g) => {
            const guarantorUser = await getUserById(g.guarantor_user_id)
            return {
              id: g.id,
              userId: g.guarantor_user_id,
              userName: guarantorUser?.full_name || 'Unknown',
              status: g.status,
            }
          })
        )

        // Get pending payments for this loan
        const loanPendingPayments = pendingPayments
          .filter((p) => p.loan_id === loan.id)
          .map((p) => ({
            id: p.id,
            amount: p.amount,
            paymentMethod: p.payment_method,
            referenceId: p.reference_id,
            notes: p.notes,
            recordedBy: p.recorded_by,
            createdAt: p.created_at,
          }))

        return {
          loanId: loan.id,
          loanAmount: loan.amount,
          status: loan.status,
          borrowerId: loan.user_id,
          borrowerName: borrower?.full_name || 'Unknown',
          borrowerPhone: borrower?.phone_number || '',
          guarantors: guarantorDetails,
          amountPaid: loan.amount_paid || 0,
          remainingAmount: loan.amount - (loan.amount_paid || 0),
          pendingPayments: loanPendingPayments,
          dueDate: loan.due_date,
          approvedAt: loan.approved_at,
          disbursedAt: loan.disbursed_at,
          paidAt: loan.paid_at,
          createdAt: loan.created_at,
        }
      })
    )

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        loans: loansWithDetails,
      },
    })
  } catch (error) {
    console.error('Get chama loans error:', error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch loans',
      },
      { status: 500 }
    )
  }
}

