import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { getCycleById } from '@/lib/db/queries/cycles'
import { getCycleMemberByCycleMemberId, updateCycleMember } from '@/lib/db/queries/cycle-members'
import { getChamaMember } from '@/lib/db/queries/chama-members'
import { getChamaById } from '@/lib/db/queries/chamas'
import { validateCustomSavingsAmount } from '@/lib/utils/validation'
import type { ApiResponse } from '@/lib/types/api'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; cycleId: string; memberId: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id: chamaId, cycleId, memberId } = await params
    const body = await request.json()

    const { custom_savings_amount, hide_savings } = body

    // Get chama and verify user is a member
    const chama = await getChamaById(chamaId)
    if (!chama) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Chama not found' },
        { status: 404 }
      )
    }

    const member = await getChamaMember(chamaId, user.id)
    if (!member) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'You are not a member of this chama' },
        { status: 403 }
      )
    }

    // Get cycle
    const cycle = await getCycleById(cycleId)
    if (!cycle) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Cycle not found' },
        { status: 404 }
      )
    }

    // Verify cycle belongs to chama
    if (cycle.chama_id !== chamaId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Cycle does not belong to this chama' },
        { status: 400 }
      )
    }

    // Get cycle member
    const cycleMember = await getCycleMemberByCycleMemberId(cycleId, memberId)
    if (!cycleMember) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Cycle member not found' },
        { status: 404 }
      )
    }

    // Verify user can update (must be the member themselves or an admin)
    const isAdmin = member.role === 'admin'
    const isOwnMember = cycleMember.user_id === user.id

    if (!isAdmin && !isOwnMember) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'You can only update your own savings settings' },
        { status: 403 }
      )
    }

    // Validate custom savings amount if provided
    if (custom_savings_amount !== undefined && custom_savings_amount !== null) {
      // Only allow for savings and hybrid chamas
      if (chama.chama_type === 'merry_go_round') {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Custom savings is not available for merry-go-round chamas' },
          { status: 400 }
        )
      }

      // Validate amount
      const validation = validateCustomSavingsAmount(
        custom_savings_amount,
        cycle.contribution_amount,
        chama.chama_type
      )
      if (!validation.valid) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: validation.error },
          { status: 400 }
        )
      }

      // Lock savings amount changes after cycle starts (only allow for pending cycles)
      if (cycle.status !== 'pending' && custom_savings_amount !== cycleMember.custom_savings_amount) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: 'Savings amount cannot be changed after cycle starts. Only privacy setting can be updated.',
          },
          { status: 400 }
        )
      }
    }

    // Update cycle member
    const updateData: {
      custom_savings_amount?: number | null
      hide_savings?: number
    } = {}

    if (custom_savings_amount !== undefined) {
      updateData.custom_savings_amount = custom_savings_amount
    }

    if (hide_savings !== undefined) {
      // Validate hide_savings is 0 or 1
      if (hide_savings !== 0 && hide_savings !== 1) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'hide_savings must be 0 or 1' },
          { status: 400 }
        )
      }
      updateData.hide_savings = hide_savings
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      )
    }

    const updatedCycleMember = await updateCycleMember(memberId, updateData)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: updatedCycleMember,
      message: 'Savings settings updated successfully',
    })
  } catch (error) {
    console.error('Update savings settings error:', error)
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to update savings settings. Please try again.',
      },
      { status: 500 }
    )
  }
}

