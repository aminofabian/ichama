import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { getPayoutById } from '@/lib/db/queries/payouts'
import { getCycleById } from '@/lib/db/queries/cycles'
import { getChamaMember } from '@/lib/db/queries/chama-members'
import { confirmPayoutReceipt } from '@/lib/services/payout-service'
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

    // Check if user is the recipient
    if (payout.user_id !== user.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'You can only confirm your own payouts' },
        { status: 403 }
      )
    }

    // Verify user is a member of the chama
    const cycle = await getCycleById(payout.cycle_id)
    if (!cycle) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Cycle not found' },
        { status: 404 }
      )
    }

    const member = await getChamaMember(cycle.chama_id, user.id)
    if (!member) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'You are not a member of this chama' },
        { status: 403 }
      )
    }

    if (payout.status !== 'paid') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Payout must be marked as paid before confirmation' },
        { status: 400 }
      )
    }

    if (payout.confirmed_by_member === 1) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Payout has already been confirmed' },
        { status: 400 }
      )
    }

    await confirmPayoutReceipt(id, user.id)

    const updatedPayout = await getPayoutById(id)

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Payout confirmed successfully',
      data: { payout: updatedPayout },
    })
  } catch (error) {
    console.error('Confirm payout error:', error)
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to confirm payout. Please try again.',
      },
      { status: 500 }
    )
  }
}

