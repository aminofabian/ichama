import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { getActiveGuaranteesByUser, getLoanById } from '@/lib/db/queries/loans'
import { getUserById } from '@/lib/db/queries/users'
import { getChamaById } from '@/lib/db/queries/chamas'
import type { ApiResponse } from '@/lib/types/api'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    const activeGuarantees = await getActiveGuaranteesByUser(user.id)

    if (activeGuarantees.length === 0) {
      return NextResponse.json<ApiResponse>({
        success: true,
        data: { hasActiveGuarantees: false, guarantees: [] },
      })
    }

    const guaranteesWithDetails = await Promise.all(
      activeGuarantees.map(async (guarantee) => {
        const loan = await getLoanById(guarantee.loan_id)
        if (!loan) return null

        const borrower = await getUserById(loan.user_id)
        if (!borrower) return null

        const chama = await getChamaById(loan.chama_id)
        if (!chama) return null

        const remainingAmount = loan.amount - (loan.amount_paid || 0)
        const isFullyPaid = remainingAmount <= 0

        return {
          loanId: loan.id,
          borrowerName: borrower.full_name || 'Unknown',
          borrowerPhone: borrower.phone_number || '',
          chamaName: chama.name,
          loanAmount: loan.amount,
          amountPaid: loan.amount_paid || 0,
          remainingAmount,
          isFullyPaid,
          loanStatus: loan.status,
        }
      })
    )

    const validGuarantees = guaranteesWithDetails.filter(
      (g): g is NonNullable<typeof g> => g !== null && !g.isFullyPaid
    )

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        hasActiveGuarantees: validGuarantees.length > 0,
        guarantees: validGuarantees,
      },
    })
  } catch (error) {
    console.error('Check guarantees error:', error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check guarantees',
      },
      { status: 500 }
    )
  }
}

