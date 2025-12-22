import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { getUserChamas } from '@/lib/db/queries/chamas'
import { getSavingsAccount } from '@/lib/db/queries/savings'
import db from '@/lib/db/client'
import type { ApiResponse } from '@/lib/types/api'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    const chamas = await getUserChamas(user.id)
    const savingsAccount = await getSavingsAccount(user.id)

    const totalContributionsResult = await db.execute({
      sql: `SELECT COALESCE(SUM(amount_paid), 0) as total
            FROM contributions
            WHERE user_id = ? AND status IN ('paid', 'confirmed')`,
      args: [user.id],
    })
    const totalContributions =
      (totalContributionsResult.rows[0]?.total as number) || 0

    const upcomingPayoutResult = await db.execute({
      sql: `SELECT p.*, c.name as cycle_name, ch.name as chama_name
            FROM payouts p
            INNER JOIN cycles c ON p.cycle_id = c.id
            INNER JOIN chamas ch ON c.chama_id = ch.id
            WHERE p.user_id = ? AND p.status = 'scheduled'
            ORDER BY p.scheduled_date ASC
            LIMIT 1`,
      args: [user.id],
    })
    const upcomingPayout =
      upcomingPayoutResult.rows.length > 0
        ? upcomingPayoutResult.rows[0]
        : null

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        chamas,
        stats: {
          activeChamas: chamas.length,
          totalContributions,
          savingsBalance: savingsAccount?.balance || 0,
          upcomingPayout: upcomingPayout
            ? {
                amount: upcomingPayout.amount,
                scheduledDate: upcomingPayout.scheduled_date,
                chamaName: upcomingPayout.chama_name,
                cycleName: upcomingPayout.cycle_name,
              }
            : null,
        },
      },
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to fetch dashboard data',
      },
      { status: 500 }
    )
  }
}

