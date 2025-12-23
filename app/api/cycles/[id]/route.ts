import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { getCycleById, updateCycle } from '@/lib/db/queries/cycles'
import { getCycleMembers } from '@/lib/db/queries/cycle-members'
import { getChamaById } from '@/lib/db/queries/chamas'
import { getChamaMember } from '@/lib/db/queries/chama-members'
import { getUserById } from '@/lib/db/queries/users'
import { startCycle, advancePeriod } from '@/lib/services/cycle-service'
import type { ApiResponse } from '@/lib/types/api'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params

    const cycle = await getCycleById(id)
    if (!cycle) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Cycle not found' },
        { status: 404 }
      )
    }

    // Check if user is a member of the chama
    const member = await getChamaMember(cycle.chama_id, user.id)
    if (!member) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'You are not a member of this chama' },
        { status: 403 }
      )
    }

    // Get cycle members with user details
    const cycleMembers = await getCycleMembers(id)
    const membersWithUsers = await Promise.all(
      cycleMembers.map(async (cm) => {
        const memberUser = await getUserById(cm.user_id)
        return {
          ...cm,
          user: memberUser
            ? {
                id: memberUser.id,
                full_name: memberUser.full_name,
                phone_number: memberUser.phone_number,
              }
            : null,
        }
      })
    )

    // Get contributions and payouts
    const { getCycleContributions, getCycleContributionStats } = await import('@/lib/db/queries/contributions')
    const { getCyclePayouts } = await import('@/lib/db/queries/payouts')
    
    const contributions = await getCycleContributions(id)
    const payouts = await getCyclePayouts(id)
    const stats = await getCycleContributionStats(id)

    // Get current period payout
    const currentPeriodPayout = cycle.current_period > 0
      ? await (await import('@/lib/db/queries/payouts')).getPeriodPayout(id, cycle.current_period)
      : null

    // Get chama to include chama_type
    const chama = await getChamaById(cycle.chama_id)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        cycle,
        chama: chama ? { chama_type: chama.chama_type } : null,
        members: membersWithUsers,
        contributions,
        payouts,
        stats,
        currentPeriodPayout,
        isAdmin: member.role === 'admin',
      },
    })
  } catch (error) {
    console.error('Get cycle error:', error)
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to fetch cycle. Please try again.',
      },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params
    const body = await request.json()

    const cycle = await getCycleById(id)
    if (!cycle) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Cycle not found' },
        { status: 404 }
      )
    }

    // Check if user is admin
    const member = await getChamaMember(cycle.chama_id, user.id)
    if (!member || member.role !== 'admin') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Only admins can update cycles' },
        { status: 403 }
      )
    }

    const { action } = body

    if (action === 'start') {
      await startCycle(id)
      
      return NextResponse.json<ApiResponse>({
        success: true,
        message: 'Cycle started successfully',
        data: await getCycleById(id),
      })
    }

    if (action === 'pause') {
      if (cycle.status !== 'active') {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Only active cycles can be paused' },
          { status: 400 }
        )
      }

      await updateCycle(id, { status: 'paused' })

      return NextResponse.json<ApiResponse>({
        success: true,
        message: 'Cycle paused successfully',
        data: await getCycleById(id),
      })
    }

    if (action === 'resume') {
      if (cycle.status !== 'paused') {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Only paused cycles can be resumed' },
          { status: 400 }
        )
      }

      await updateCycle(id, { status: 'active' })

      return NextResponse.json<ApiResponse>({
        success: true,
        message: 'Cycle resumed successfully',
        data: await getCycleById(id),
      })
    }

    if (action === 'advance') {
      await advancePeriod(id)

      return NextResponse.json<ApiResponse>({
        success: true,
        message: 'Period advanced successfully',
        data: await getCycleById(id),
      })
    }

    if (action === 'cancel') {
      if (cycle.status === 'completed') {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Cannot cancel a completed cycle' },
          { status: 400 }
        )
      }

      await updateCycle(id, { status: 'cancelled' })

      return NextResponse.json<ApiResponse>({
        success: true,
        message: 'Cycle cancelled successfully',
        data: await getCycleById(id),
      })
    }

    // Generic update
    const updates = { ...body }
    delete updates.action

    const updatedCycle = await updateCycle(id, updates)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: updatedCycle,
    })
  } catch (error) {
    console.error('Update cycle error:', error)
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update cycle. Please try again.',
      },
      { status: 500 }
    )
  }
}

