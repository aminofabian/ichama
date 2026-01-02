import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { getUserChamas } from '@/lib/db/queries/chamas'
import { getActiveGuaranteesByUser } from '@/lib/db/queries/loans'
import { getChamaMember } from '@/lib/db/queries/chama-members'
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
      confirmedContributionsResult,
      upcomingPayoutResult,
      pendingContributionsResult,
      unconfirmedContributionsResult,
      adminTotalSavingsResult,
      pendingGuarantorLoansResult,
      pendingAdminLoansResult,
      userLoansResult,
    ] = await Promise.all([
      getUserChamas(user.id),
      db.execute({
        sql: `SELECT COALESCE(SUM(amount), 0) as total
              FROM payouts
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
      // Get confirmed contributions with details needed for savings calculation
      db.execute({
      sql: `SELECT 
              ch.id as chama_id,
              ch.chama_type,
              c.amount_paid,
              cy.contribution_amount,
              cy.payout_amount,
              cy.service_fee,
              COALESCE(cm.custom_savings_amount, cy.savings_amount) as member_savings_amount
            FROM contributions c
            INNER JOIN cycles cy ON c.cycle_id = cy.id
            INNER JOIN chamas ch ON cy.chama_id = ch.id
            LEFT JOIN cycle_members cm ON c.cycle_member_id = cm.id
            WHERE c.user_id = ? 
              AND c.status = 'confirmed'`,
      args: [user.id],
      }),
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
      // Get total savings collected across all chamas where user is admin (member_role = 'admin')
      db.execute({
        sql: `SELECT 
                ch.id as chama_id,
                ch.chama_type,
                c.amount_paid,
                cy.payout_amount,
                cy.service_fee,
                COALESCE(cyclm.custom_savings_amount, cy.savings_amount) as member_savings_amount
              FROM contributions c
              INNER JOIN cycles cy ON c.cycle_id = cy.id
              INNER JOIN chamas ch ON cy.chama_id = ch.id
              INNER JOIN chama_members chm ON ch.id = chm.chama_id AND chm.user_id = ? AND chm.role = 'admin'
              LEFT JOIN cycle_members cyclm ON c.cycle_member_id = cyclm.id
              WHERE c.status = 'confirmed'
                AND (ch.chama_type = 'savings' OR ch.chama_type = 'hybrid')`,
        args: [user.id],
      }),
      // Get pending loan requests where user is a guarantor
      (async () => {
        const guarantees = await getActiveGuaranteesByUser(user.id)
        const pendingGuarantees = guarantees.filter((g) => g.status === 'pending')
        return { rows: pendingGuarantees }
      })(),
      // Get pending loan requests where user is an admin (will process after chamas is available)
      Promise.resolve({ rows: [] }),
      // Get user's own loans
      (async () => {
        const { getUserLoans } = await import('@/lib/db/queries/loans')
        const userLoans = await getUserLoans(user.id)
        return { rows: userLoans }
      })(),
    ])

    const totalReceivedValue = totalContributionsResult.rows[0]?.total
    const totalReceived = totalReceivedValue != null ? Number(totalReceivedValue) : 0

    // Get pending admin loans now that we have chamas
    const adminChamas = chamas.filter((c: any) => c.member_role === 'admin')
    let actualPendingAdminLoansResult: { rows: any[] } = { rows: [] }
    if (adminChamas.length > 0) {
      const chamaIds = adminChamas.map((c: any) => c.id)
      const placeholders = chamaIds.map(() => '?').join(',')
      const result = await db.execute({
        sql: `SELECT l.* FROM loans l
              WHERE l.chama_id IN (${placeholders})
              AND l.status = 'pending'
              ORDER BY l.created_at DESC`,
        args: chamaIds,
      })
      actualPendingAdminLoansResult = result as { rows: any[] }
    }

    // Calculate total savings collected across all chamas where user is admin
    let adminTotalSavingsCollected = 0
    // User is admin if they have admin role in any chama
    const isAdmin = chamas.some((c: any) => c.member_role === 'admin')
    
    adminTotalSavingsResult.rows.forEach((row: any) => {
      const chamaType = row.chama_type
      const amountPaid = Number(row.amount_paid) || 0
      const payoutAmount = Number(row.payout_amount) || 0
      const serviceFee = Number(row.service_fee) || 0
      const memberSavingsAmount = Number(row.member_savings_amount) || 0
      
      const amountAfterFee = Math.max(0, amountPaid - serviceFee)
      
      if (chamaType === 'savings') {
        adminTotalSavingsCollected += amountAfterFee
      } else if (chamaType === 'hybrid') {
        const savingsFromPayment = Math.max(0, amountAfterFee - payoutAmount)
        adminTotalSavingsCollected += Math.min(memberSavingsAmount, savingsFromPayment)
      }
    })

    // Calculate savings and merry-go-round contributions from CONFIRMED contributions
    // This matches processContributionConfirmation in contribution-service.ts
    const savingsPerChamaMap = new Map<string, number>()
    let totalSavingsBalance = 0
    let totalMerryGoRoundContributions = 0
    
    confirmedContributionsResult.rows.forEach((row: any) => {
      const chamaId = row.chama_id
      const chamaType = row.chama_type
      const amountPaid = Number(row.amount_paid) || 0
      const payoutAmount = Number(row.payout_amount) || 0
      const serviceFee = Number(row.service_fee) || 0
      const memberSavingsAmount = Number(row.member_savings_amount) || 0
      
      // Service fee is always deducted from the amount before calculating
      const amountAfterFee = Math.max(0, amountPaid - serviceFee)
      
      // Calculate merry-go-round (payout) contributions
      if (chamaType === 'merry_go_round') {
        // For merry-go-round: full amount after fee goes to payout pool
        totalMerryGoRoundContributions += amountAfterFee
      } else if (chamaType === 'hybrid') {
        // For hybrid: payout portion goes to payout pool
        const payoutContribution = Math.min(payoutAmount, amountAfterFee)
        totalMerryGoRoundContributions += payoutContribution
      }
      
      // Calculate savings
      if (chamaType === 'savings' || chamaType === 'hybrid') {
        let savingsAmount = 0
        
        if (chamaType === 'savings') {
          // For savings chamas: amount paid minus service fee is savings
          savingsAmount = amountAfterFee
        } else if (chamaType === 'hybrid') {
          // For hybrid chamas: savings = amount paid beyond (payout + service fee), capped at savings target
          const savingsFromPayment = Math.max(0, amountAfterFee - payoutAmount)
          savingsAmount = Math.min(memberSavingsAmount, savingsFromPayment)
        }
        
        if (savingsAmount > 0) {
          const currentSavings = savingsPerChamaMap.get(chamaId) || 0
          savingsPerChamaMap.set(chamaId, currentSavings + savingsAmount)
          totalSavingsBalance += savingsAmount
        }
      }
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

    // Process pending guarantor loans
    const { getUserById } = await import('@/lib/db/queries/users')
    const { getLoanById } = await import('@/lib/db/queries/loans')
    const { getChamaById } = await import('@/lib/db/queries/chamas')
    
    const pendingGuarantorLoans = await Promise.all(
      (pendingGuarantorLoansResult.rows as any[]).map(async (guarantee: any) => {
        const loan = await getLoanById(guarantee.loan_id)
        if (!loan) return null

        const chama = await getChamaById(loan.chama_id)
        if (!chama) return null

        const borrower = await getUserById(loan.user_id)
        if (!borrower) return null

        return {
          loanId: loan.id,
          guaranteeId: guarantee.id,
          loanAmount: loan.amount,
          defaultInterestRate: chama.default_interest_rate || 0,
          borrowerName: borrower.full_name,
          borrowerPhone: borrower.phone_number,
          chamaId: chama.id,
          chamaName: chama.name,
          createdAt: loan.created_at,
        }
      })
    )

    // Process pending admin loans
    const { getLoanGuarantors } = await import('@/lib/db/queries/loans')
    const pendingAdminLoans = await Promise.all(
      (actualPendingAdminLoansResult.rows as any[]).map(async (loan: any) => {
        const borrower = await getUserById(loan.user_id)
        const guarantors = await getLoanGuarantors(loan.id)
        const { getChamaById } = await import('@/lib/db/queries/chamas')
        const chama = await getChamaById(loan.chama_id)
        const defaultInterestRate = chama?.default_interest_rate || 0
        
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

        return {
          loanId: loan.id,
          loanAmount: loan.amount,
          defaultInterestRate,
          borrowerName: borrower?.full_name || 'Unknown',
          borrowerPhone: borrower?.phone_number || '',
          chamaId: loan.chama_id,
          chamaName: chamas.find((c: any) => c.id === loan.chama_id)?.name || 'Unknown',
          guarantors: guarantorDetails,
          createdAt: loan.created_at,
        }
      })
    )

    // Process user's own loans
    const userLoans = await Promise.all(
      ((userLoansResult as any).rows || []).map(async (loan: any) => {
        const chama = chamas.find((c: any) => c.id === loan.chama_id)
        const guarantors = await getLoanGuarantors(loan.id)
        const { getLoanPayments } = await import('@/lib/db/queries/loans')
        const allPayments = await getLoanPayments(loan.id)
        const pendingPayments = allPayments.filter(p => p.status === 'pending')
        
        const guarantorDetails = await Promise.all(
          guarantors.map(async (g) => {
            const guarantorUser = await getUserById(g.guarantor_user_id)
            return {
              id: g.id,
              userName: guarantorUser?.full_name || 'Unknown',
              status: g.status,
            }
          })
        )

        // For pending loans, use chama's default interest rate as estimate
        // For approved/active loans, use the actual interest rate set during approval
        const { getChamaById } = await import('@/lib/db/queries/chamas')
        const chamaDetails = await getChamaById(loan.chama_id)
        const defaultInterestRate = chamaDetails?.default_interest_rate || 0
        const interestRate = loan.interest_rate !== null && loan.interest_rate !== undefined 
          ? loan.interest_rate 
          : (loan.status === 'pending' ? defaultInterestRate : 0)
        
        const principalAmount = loan.amount
        const interestAmount = (principalAmount * interestRate) / 100
        const totalLoanAmount = principalAmount + interestAmount
        const amountPaid = loan.amount_paid || 0
        const remainingAmount = totalLoanAmount - amountPaid

        // Correct status if incorrectly marked as paid (only principal paid, not interest)
        let correctedStatus = loan.status
        if (loan.status === 'paid' && amountPaid < totalLoanAmount) {
          correctedStatus = 'active' // Change back to active if not fully paid
          // Optionally update the database (commented out to avoid side effects)
          // await updateLoanStatus(loan.id, 'active')
        }

        return {
          loanId: loan.id,
          loanAmount: principalAmount,
          totalLoanAmount,
          interestRate,
          interestAmount,
          status: correctedStatus,
          chamaId: loan.chama_id,
          chamaName: chama?.name || 'Unknown',
          guarantors: guarantorDetails,
          amountPaid,
          remainingAmount,
          dueDate: loan.due_date,
          approvedAt: loan.approved_at,
          disbursedAt: loan.disbursed_at,
          paidAt: loan.paid_at,
          createdAt: loan.created_at,
          pendingPayments: pendingPayments.map(p => ({
            paymentId: p.id,
            amount: p.amount,
            createdAt: p.created_at,
          })),
        }
      })
    )

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        chamas,
        pendingContributions,
        unconfirmedContributions: Object.fromEntries(unconfirmedByChama),
        chamaStats,
        pendingGuarantorLoans: pendingGuarantorLoans.filter((item): item is NonNullable<typeof item> => item !== null),
        pendingAdminLoans,
        userLoans,
        stats: {
          activeChamas: chamas.length,
          totalReceived,
          savingsBalance: totalSavingsBalance,
          merryGoRoundContributions: totalMerryGoRoundContributions,
          // Track which chama types user has for conditional UI display
          hasSavingsChama: chamas.some((c: any) => c.chama_type === 'savings' || c.chama_type === 'hybrid'),
          hasMerryGoRoundChama: chamas.some((c: any) => c.chama_type === 'merry_go_round' || c.chama_type === 'hybrid'),
          // Admin-only: total savings collected across all chamas user administers
          isAdmin,
          adminTotalSavingsCollected: isAdmin ? adminTotalSavingsCollected : null,
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

