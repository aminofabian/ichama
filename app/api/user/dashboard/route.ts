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

    // Get pending contributions with cycle and chama info
    const pendingContributionsResult = await db.execute({
      sql: `SELECT 
              c.id, c.cycle_id, c.cycle_member_id, c.user_id, c.period_number,
              c.amount_due, c.amount_paid, c.due_date, c.status,
              cy.name as cycle_name, cy.contribution_amount, cy.savings_amount,
              ch.id as chama_id, ch.name as chama_name, ch.chama_type,
              cm.custom_savings_amount
            FROM contributions c
            INNER JOIN cycles cy ON c.cycle_id = cy.id
            INNER JOIN chamas ch ON cy.chama_id = ch.id
            LEFT JOIN cycle_members cm ON c.cycle_member_id = cm.id
            WHERE c.user_id = ? 
              AND c.status IN ('pending', 'partial')
              AND c.amount_paid < c.amount_due
            ORDER BY c.due_date ASC`,
      args: [user.id],
    })

    const pendingContributions = pendingContributionsResult.rows.map((row: any) => ({
      id: row.id,
      cycle_id: row.cycle_id,
      cycle_member_id: row.cycle_member_id,
      user_id: row.user_id,
      period_number: row.period_number,
      amount_due: row.amount_due,
      amount_paid: row.amount_paid,
      due_date: row.due_date,
      status: row.status,
      cycle_name: row.cycle_name,
      contribution_amount: row.contribution_amount,
      savings_amount: row.savings_amount,
      chama_id: row.chama_id,
      chama_name: row.chama_name,
      chama_type: row.chama_type,
      custom_savings_amount: row.custom_savings_amount,
    }))

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        chamas,
        pendingContributions,
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

