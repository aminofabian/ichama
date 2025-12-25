import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { getUserChamas } from '@/lib/db/queries/chamas'
import { getSavingsAccount } from '@/lib/db/queries/savings'
import db from '@/lib/db/client'
import type { ApiResponse } from '@/lib/types/api'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    // Parallelize independent queries
    const [
      chamas,
      totalContributionsResult,
      perChamaStatsResult,
      savingsPerChamaResult,
      savingsAccount,
      upcomingPayoutResult,
      pendingContributionsResult,
      unconfirmedContributionsResult,
    ] = await Promise.all([
      getUserChamas(user.id),
      db.execute({
        sql: `SELECT COALESCE(SUM(amount_paid), 0) as total
              FROM contributions
              WHERE user_id = ? AND status IN ('paid', 'confirmed')`,
        args: [user.id],
      }),
      db.execute({
        sql: `SELECT 
                ch.id as chama_id,
                ch.name as chama_name,
                ch.chama_type,
                COALESCE(SUM(c.amount_paid), 0) as total_paid,
                COALESCE(SUM(cy.contribution_amount), 0) as total_contribution_target,
                COALESCE(SUM(COALESCE(cm.custom_savings_amount, cy.savings_amount)), 0) as total_savings_target
              FROM contributions c
              INNER JOIN cycles cy ON c.cycle_id = cy.id
              INNER JOIN chamas ch ON cy.chama_id = ch.id
              LEFT JOIN cycle_members cm ON c.cycle_member_id = cm.id
              WHERE c.user_id = ? AND c.status IN ('paid', 'confirmed')
              GROUP BY ch.id, ch.name, ch.chama_type`,
        args: [user.id],
      }),
      // Get actual savings per chama from savings_transactions (more efficient than recalculating)
      db.execute({
        sql: `SELECT 
                ch.id as chama_id,
                COALESCE(SUM(st.amount), 0) as total_savings
              FROM savings_transactions st
              INNER JOIN cycles cy ON st.cycle_id = cy.id
              INNER JOIN chamas ch ON cy.chama_id = ch.id
              WHERE st.user_id = ? AND st.type = 'credit' AND st.reason = 'contribution'
              GROUP BY ch.id`,
        args: [user.id],
      }),
      getSavingsAccount(user.id),
      db.execute({
        sql: `SELECT p.*, c.name as cycle_name, ch.name as chama_name
              FROM payouts p
              INNER JOIN cycles c ON p.cycle_id = c.id
              INNER JOIN chamas ch ON c.chama_id = ch.id
              WHERE p.user_id = ? AND p.status = 'scheduled'
              ORDER BY p.scheduled_date ASC
              LIMIT 1`,
        args: [user.id],
      }),
      db.execute({
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
                AND c.status != 'confirmed'
                AND (
                  c.amount_paid < cy.contribution_amount
                  OR
                  (c.amount_paid > cy.contribution_amount 
                   AND c.amount_paid < (cy.contribution_amount + COALESCE(cm.custom_savings_amount, cy.savings_amount)))
                )
              ORDER BY c.due_date ASC`,
        args: [user.id],
      }),
      db.execute({
        sql: `SELECT 
                c.id, c.cycle_id, c.cycle_member_id, c.user_id, c.period_number,
                c.amount_due, c.amount_paid, c.due_date, c.status, c.paid_at,
                cy.name as cycle_name, cy.contribution_amount, cy.savings_amount,
                ch.id as chama_id, ch.name as chama_name, ch.chama_type,
                cm.custom_savings_amount
              FROM contributions c
              INNER JOIN cycles cy ON c.cycle_id = cy.id
              INNER JOIN chamas ch ON cy.chama_id = ch.id
              LEFT JOIN cycle_members cm ON c.cycle_member_id = cm.id
              WHERE c.user_id = ? 
                AND c.status = 'paid'
                AND c.amount_paid >= cy.contribution_amount
              ORDER BY c.paid_at DESC`,
        args: [user.id],
      }),
    ])

    const totalContributions = (totalContributionsResult.rows[0]?.total as number) || 0
    const totalSavingsBalance = savingsAccount?.balance || 0

    // Build savings per chama map from savings_transactions
    const savingsPerChamaMap = new Map<string, number>()
    savingsPerChamaResult.rows.forEach((row: any) => {
      savingsPerChamaMap.set(row.chama_id, row.total_savings || 0)
    })

    const chamaStats = perChamaStatsResult.rows.map((row: any) => {
      const totalPaid = row.total_paid || 0
      const contributionTarget = row.total_contribution_target || 0
      const savingsTarget = row.total_savings_target || 0
      
      const contributionPaid = Math.min(totalPaid, contributionTarget)
      const savingsPaid = Math.max(0, totalPaid - contributionTarget)
      const actualSavings = savingsPerChamaMap.get(row.chama_id) || 0
      
      return {
        chamaId: row.chama_id,
        chamaName: row.chama_name,
        chamaType: row.chama_type,
        contributionPaid,
        savingsPaid,
        totalPaid,
        actualSavings,
      }
    })

    const upcomingPayout =
      upcomingPayoutResult.rows.length > 0
        ? upcomingPayoutResult.rows[0]
        : null

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

    const unconfirmedContributions = unconfirmedContributionsResult.rows.map((row: any) => ({
      id: row.id,
      cycle_id: row.cycle_id,
      cycle_member_id: row.cycle_member_id,
      user_id: row.user_id,
      period_number: row.period_number,
      amount_due: row.amount_due,
      amount_paid: row.amount_paid,
      due_date: row.due_date,
      status: row.status,
      paid_at: row.paid_at,
      cycle_name: row.cycle_name,
      contribution_amount: row.contribution_amount,
      savings_amount: row.savings_amount,
      chama_id: row.chama_id,
      chama_name: row.chama_name,
      chama_type: row.chama_type,
      custom_savings_amount: row.custom_savings_amount,
    }))

    // Group unconfirmed contributions by chama_id
    const unconfirmedByChama = new Map<string, typeof unconfirmedContributions>()
    unconfirmedContributions.forEach((contrib) => {
      const existing = unconfirmedByChama.get(contrib.chama_id) || []
      existing.push(contrib)
      unconfirmedByChama.set(contrib.chama_id, existing)
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        chamas,
        pendingContributions,
        unconfirmedContributions: Object.fromEntries(unconfirmedByChama),
        chamaStats,
        stats: {
          activeChamas: chamas.length,
          totalContributions,
          savingsBalance: totalSavingsBalance,
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

