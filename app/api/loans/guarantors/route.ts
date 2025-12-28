import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { getUserChamas } from '@/lib/db/queries/chamas'
import { getChamaMembers } from '@/lib/db/queries/chama-members'
import { getUserById } from '@/lib/db/queries/users'
import { getSavingsAccount } from '@/lib/db/queries/savings'
import { getActiveGuaranteesByUser } from '@/lib/db/queries/loans'
import type { ApiResponse } from '@/lib/types/api'

const LOAN_LIMIT_THRESHOLD = 2000
const LOAN_LIMIT_MULTIPLIER = 1.1

function calculateLoanLimit(savings: number): number {
  if (savings > LOAN_LIMIT_THRESHOLD) {
    return Math.floor(savings * LOAN_LIMIT_MULTIPLIER)
  }
  return 0
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    const userChamas = await getUserChamas(user.id)
    const allGuarantors: Array<{
      id: string
      userId: string
      userName: string
      userPhone: string
      chamaId: string
      chamaName: string
      savingsBalance: number
      loanLimit: number
    }> = []

    for (const chama of userChamas) {
      const members = await getChamaMembers(chama.id)
      
      for (const member of members) {
        if (member.user_id === user.id) continue

        const memberUser = await getUserById(member.user_id)
        if (!memberUser) continue

        const activeGuarantees = await getActiveGuaranteesByUser(member.user_id)
        if (activeGuarantees.length > 0) {
          continue
        }

        const savingsAccount = await getSavingsAccount(member.user_id)
        const savingsBalance = savingsAccount?.balance || 0
        const loanLimit = calculateLoanLimit(savingsBalance)

        allGuarantors.push({
          id: `${chama.id}-${member.user_id}`,
          userId: member.user_id,
          userName: memberUser.full_name || 'Unknown',
          userPhone: memberUser.phone_number || '',
          chamaId: chama.id,
          chamaName: chama.name,
          savingsBalance,
          loanLimit,
        })
      }
    }

    const uniqueGuarantors = Array.from(
      new Map(allGuarantors.map((g) => [g.userId, g])).values()
    )

    return NextResponse.json<ApiResponse>({
      success: true,
      data: uniqueGuarantors,
    })
  } catch (error) {
    console.error('Get guarantors error:', error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch guarantors',
      },
      { status: 500 }
    )
  }
}

