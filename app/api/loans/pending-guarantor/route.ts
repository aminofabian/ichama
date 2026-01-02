import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { getActiveGuaranteesByUser } from '@/lib/db/queries/loans'
import { getLoanById } from '@/lib/db/queries/loans'
import { getChamaById } from '@/lib/db/queries/chamas'
import { getUserById } from '@/lib/db/queries/users'
import type { ApiResponse } from '@/lib/types/api'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    const pendingGuarantees = await getActiveGuaranteesByUser(user.id)
    const pendingList = pendingGuarantees.filter((g) => g.status === 'pending')

    const loansWithDetails = await Promise.all(
      pendingList.map(async (guarantee) => {
        const loan = await getLoanById(guarantee.loan_id)
        if (!loan) return null

        const chama = await getChamaById(loan.chama_id)
        if (!chama) return null

        const borrower = await getUserById(loan.user_id)
        if (!borrower) return null

        return {
          loanId: loan.id,
          loanAmount: loan.amount,
          borrowerName: borrower.full_name,
          borrowerPhone: borrower.phone_number,
          chamaId: chama.id,
          chamaName: chama.name,
          guaranteeId: guarantee.id,
          status: guarantee.status,
          createdAt: loan.created_at,
        }
      })
    )

    return NextResponse.json<ApiResponse>({
      success: true,
      data: loansWithDetails.filter((item): item is NonNullable<typeof item> => item !== null),
    })
  } catch (error) {
    console.error('Get pending guarantor loans error:', error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch pending loans',
      },
      { status: 500 }
    )
  }
}

