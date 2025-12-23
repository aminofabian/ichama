import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { getPayoutById, updatePayout } from '@/lib/db/queries/payouts'
import { getCycleById } from '@/lib/db/queries/cycles'
import { getChamaMember } from '@/lib/db/queries/chama-members'
import { processPayout } from '@/lib/services/payout-service'
import type { ApiResponse } from '@/lib/types/api'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params

    const payout = await getPayoutById(id)
    if (!payout) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Payout not found' },
        { status: 404 }
      )
    }

    // Check if user is admin
    const cycle = await getCycleById(payout.cycle_id)
    if (!cycle) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Cycle not found' },
        { status: 404 }
      )
    }

    const member = await getChamaMember(cycle.chama_id, user.id)
    if (!member || member.role !== 'admin') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Only admins can mark payouts as sent' },
        { status: 403 }
      )
    }

    if (payout.status === 'paid' || payout.status === 'confirmed') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Payout has already been processed' },
        { status: 400 }
      )
    }

    await processPayout(id, user.id)

    const updatedPayout = await getPayoutById(id)

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Payout marked as sent successfully',
      data: { payout: updatedPayout },
    })
  } catch (error) {
    console.error('Send payout error:', error)
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send payout. Please try again.',
      },
      { status: 500 }
    )
  }
}

