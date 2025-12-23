import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { getUserChamas } from '@/lib/db/queries/chamas'
import { getCyclePayouts } from '@/lib/db/queries/payouts'
import { getAllMemberPayouts } from '@/lib/db/queries/payouts'
import db from '@/lib/db/client'
import type { ApiResponse } from '@/lib/types/api'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const searchParams = request.nextUrl.searchParams

    const chamaId = searchParams.get('chama_id') || undefined
    const cycleId = searchParams.get('cycle_id') || undefined
    const startDate = searchParams.get('start_date') || undefined
    const endDate = searchParams.get('end_date') || undefined
    const status = searchParams.get('status') || undefined

    // Get all user chamas (including past ones)
    const chamas = await getUserChamas(user.id)

    // Filter chamas if chama_id is provided
    const filteredChamas = chamaId
      ? chamas.filter((c) => c.id === chamaId)
      : chamas

    // Get all cycles for user's chamas
    const chamaIds = filteredChamas.map((c) => c.id)
    let cyclesQuery = `
      SELECT c.*, ch.name as chama_name
      FROM cycles c
      INNER JOIN chamas ch ON c.chama_id = ch.id
      WHERE c.chama_id IN (${chamaIds.map(() => '?').join(',')})
    `
    const cyclesArgs: unknown[] = [...chamaIds]

    if (cycleId) {
      cyclesQuery += ' AND c.id = ?'
      cyclesArgs.push(cycleId)
    }

    if (status) {
      cyclesQuery += ' AND c.status = ?'
      cyclesArgs.push(status)
    }

    if (startDate) {
      cyclesQuery += ' AND c.created_at >= ?'
      cyclesArgs.push(startDate)
    }

    if (endDate) {
      cyclesQuery += ' AND c.created_at <= ?'
      cyclesArgs.push(endDate)
    }

    cyclesQuery += ' ORDER BY c.created_at DESC'

    const cyclesResult = await (db.execute as any)({
      sql: cyclesQuery,
      args: cyclesArgs,
    })
    const cycles = cyclesResult.rows as unknown as Array<{
      id: string
      chama_id: string
      chama_name: string
      name: string
      status: string
      current_period: number
      total_periods: number
      contribution_amount: number
      payout_amount: number
      start_date: string | null
      end_date: string | null
      created_at: string
    }>

    // Get all contributions for user
    let contributionsQuery = `
      SELECT co.*, c.name as cycle_name, ch.name as chama_name
      FROM contributions co
      INNER JOIN cycles c ON co.cycle_id = c.id
      INNER JOIN chamas ch ON c.chama_id = ch.id
      WHERE co.user_id = ?
    `
    const contributionsArgs: unknown[] = [user.id]

    if (chamaId) {
      contributionsQuery += ' AND ch.id = ?'
      contributionsArgs.push(chamaId)
    }

    if (cycleId) {
      contributionsQuery += ' AND c.id = ?'
      contributionsArgs.push(cycleId)
    }

    if (status) {
      contributionsQuery += ' AND co.status = ?'
      contributionsArgs.push(status)
    }

    if (startDate) {
      contributionsQuery += ' AND co.created_at >= ?'
      contributionsArgs.push(startDate)
    }

    if (endDate) {
      contributionsQuery += ' AND co.created_at <= ?'
      contributionsArgs.push(endDate)
    }

    contributionsQuery += ' ORDER BY co.created_at DESC'

    const contributionsResult = await (db.execute as any)({
      sql: contributionsQuery,
      args: contributionsArgs,
    })
    const contributions = contributionsResult.rows as unknown as Array<{
      id: string
      cycle_id: string
      cycle_name: string
      chama_name: string
      period_number: number
      amount_due: number
      amount_paid: number
      status: string
      due_date: string
      paid_at: string | null
      created_at: string
    }>

    // Get all payouts for user
    const allPayouts = await getAllMemberPayouts(user.id)
    let payouts = allPayouts

    if (chamaId) {
      const cycleIdsForChama = cycles
        .filter((c) => c.chama_id === chamaId)
        .map((c) => c.id)
      payouts = payouts.filter((p) => cycleIdsForChama.includes(p.cycle_id))
    }

    if (cycleId) {
      payouts = payouts.filter((p) => p.cycle_id === cycleId)
    }

    if (status) {
      payouts = payouts.filter((p) => p.status === status)
    }

    // Add chama and cycle names to payouts
    const payoutsWithNames = await Promise.all(
      payouts.map(async (payout) => {
        const cycle = cycles.find((c) => c.id === payout.cycle_id)
        return {
          ...payout,
          cycle_name: cycle?.name || 'Unknown',
          chama_name: cycle?.chama_name || 'Unknown',
        }
      })
    )

    // Filter by date range if provided
    let filteredPayouts = payoutsWithNames
    if (startDate) {
      filteredPayouts = filteredPayouts.filter((p) => p.created_at >= startDate)
    }
    if (endDate) {
      filteredPayouts = filteredPayouts.filter((p) => p.created_at <= endDate)
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        chamas: filteredChamas,
        cycles,
        contributions,
        payouts: filteredPayouts,
      },
    })
  } catch (error) {
    console.error('Get history error:', error)
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to fetch history. Please try again.',
      },
      { status: 500 }
    )
  }
}

