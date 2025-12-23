import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { getChamaById } from '@/lib/db/queries/chamas'
import { getChamaMember, getChamaMembers } from '@/lib/db/queries/chama-members'
import { getUserById } from '@/lib/db/queries/users'
import { createCycle } from '@/lib/db/queries/cycles'
import { addCycleMembers } from '@/lib/db/queries/cycle-members'
import type { ApiResponse } from '@/lib/types/api'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params

    const chama = await getChamaById(id)
    if (!chama) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Chama not found' },
        { status: 404 }
      )
    }

    const member = await getChamaMember(id, user.id)
    if (!member) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'You are not a member of this chama' },
        { status: 403 }
      )
    }

    // Get cycles for this chama
    const { getChamasCycles, getActiveCycle } = await import('@/lib/db/queries/cycles')
    const cycles = await getChamasCycles(id)
    const activeCycle = await getActiveCycle(id)

    // Get pending cycle (most recent pending cycle)
    const pendingCycle = cycles.find((c) => c.status === 'pending') || null
    let pendingCycleMembers = null
    if (pendingCycle) {
      const { getCycleMembers } = await import('@/lib/db/queries/cycle-members')
      const members = await getCycleMembers(pendingCycle.id)
      const membersWithUsers = await Promise.all(
        members.map(async (m) => {
          const memberUser = await getUserById(m.user_id)
          return {
            ...m,
            user: memberUser
              ? {
                  full_name: memberUser.full_name,
                }
              : undefined,
          }
        })
      )
      pendingCycleMembers = membersWithUsers
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { cycles, activeCycle: activeCycle || null, pendingCycle, pendingCycleMembers },
    })
  } catch (error) {
    console.error('Get cycles error:', error)
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to fetch cycles. Please try again.',
      },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params
    const body = await request.json()

    const {
      name,
      contribution_amount,
      payout_amount,
      savings_amount,
      service_fee,
      frequency,
      start_date,
      total_periods,
      members,
    } = body

    const chama = await getChamaById(id)
    if (!chama) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Chama not found' },
        { status: 404 }
      )
    }

    const member = await getChamaMember(id, user.id)
    if (!member || member.role !== 'admin') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Only admins can create cycles' },
        { status: 403 }
      )
    }

    // Check if there's already an active cycle
    const { getActiveCycle } = await import('@/lib/db/queries/cycles')
    const activeCycle = await getActiveCycle(id)
    if (activeCycle) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'There is already an active cycle for this chama' },
        { status: 400 }
      )
    }

    // Validate that all members belong to the chama
    const chamaMembers = await getChamaMembers(id)
    const memberIds = new Set(chamaMembers.map((m) => m.id))
    const selectedMemberIds = members.map((m: { chama_member_id: string }) => m.chama_member_id)

    for (const memberId of selectedMemberIds) {
      if (!memberIds.has(memberId)) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Invalid member selected' },
          { status: 400 }
        )
      }
    }

    // Create cycle
    const cycle = await createCycle({
      chama_id: id,
      name,
      contribution_amount,
      payout_amount,
      savings_amount,
      service_fee,
      frequency,
      start_date,
      total_periods,
      created_by: user.id,
    })

    // Add cycle members with optional custom savings amounts
    const cycleMembersInput = members.map(
      (m: {
        chama_member_id: string
        user_id: string
        turn_order: number
        assigned_number: number
        custom_savings_amount?: number | null
        hide_savings?: number
      }) => ({
        chama_member_id: m.chama_member_id,
        user_id: m.user_id,
        turn_order: m.turn_order,
        assigned_number: m.assigned_number,
        custom_savings_amount: m.custom_savings_amount ?? null,
        hide_savings: m.hide_savings ?? 0,
      })
    )

    // Validate custom savings amounts if provided
    if (chama.chama_type !== 'merry_go_round') {
      const { validateCustomSavingsAmount } = await import('@/lib/utils/validation')
      for (const member of cycleMembersInput) {
        if (member.custom_savings_amount !== null && member.custom_savings_amount !== undefined) {
          const validation = validateCustomSavingsAmount(
            member.custom_savings_amount,
            contribution_amount,
            chama.chama_type
          )
          if (!validation.valid) {
            return NextResponse.json<ApiResponse>(
              { success: false, error: validation.error },
              { status: 400 }
            )
          }
        }
      }
    }

    await addCycleMembers(cycle.id, id, cycleMembersInput)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { cycle },
      message: 'Cycle created successfully',
    })
  } catch (error) {
    console.error('Create cycle error:', error)
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to create cycle. Please try again.',
      },
      { status: 500 }
    )
  }
}

