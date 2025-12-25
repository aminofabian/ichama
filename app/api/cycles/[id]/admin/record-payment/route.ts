import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { getCycleById } from '@/lib/db/queries/cycles'
import { getChamaMember } from '@/lib/db/queries/chama-members'
import { getCycleMemberByCycleMemberId } from '@/lib/db/queries/cycle-members'
import {
  createContribution,
  updateContribution,
  getContributionByMemberAndPeriod,
} from '@/lib/db/queries/contributions'
import type { ApiResponse } from '@/lib/types/api'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params
    const body = await request.json()

    const { cycle_member_id, period_number, amount_paid } = body

    if (!cycle_member_id || !period_number || amount_paid === undefined) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'cycle_member_id, period_number, and amount_paid are required' },
        { status: 400 }
      )
    }

    const cycle = await getCycleById(id)
    if (!cycle) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Cycle not found' },
        { status: 404 }
      )
    }

    // Check if user is an admin
    const member = await getChamaMember(cycle.chama_id, user.id)
    if (!member || member.role !== 'admin') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Only admins can record payments for other members' },
        { status: 403 }
      )
    }

    // Get the cycle member
    const cycleMember = await getCycleMemberByCycleMemberId(id, cycle_member_id)
    if (!cycleMember) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Cycle member not found' },
        { status: 404 }
      )
    }

    // Check if contribution exists
    let contribution = await getContributionByMemberAndPeriod(id, cycle_member_id, period_number)

    if (!contribution) {
      // Calculate due date based on period and frequency
      const startDate = new Date(cycle.start_date!)
      let daysToAdd = 0

      switch (cycle.frequency) {
        case 'weekly':
          daysToAdd = 7 * (period_number - 1)
          break
        case 'biweekly':
          daysToAdd = 14 * (period_number - 1)
          break
        case 'monthly':
          daysToAdd = 30 * (period_number - 1)
          break
      }

      const dueDate = new Date(startDate)
      dueDate.setDate(dueDate.getDate() + daysToAdd)

      // Create the contribution
      contribution = await createContribution({
        cycle_id: id,
        cycle_member_id,
        user_id: cycleMember.user_id,
        period_number,
        amount_due: cycle.contribution_amount,
        due_date: dueDate.toISOString(),
      })
    }

    // Determine status based on amount paid
    let status: 'paid' | 'partial' | 'pending' = 'pending'
    if (amount_paid >= contribution.amount_due) {
      status = 'paid'
    } else if (amount_paid > 0) {
      status = 'partial'
    }

    // Update the contribution with payment
    // Note: Savings are only processed when the contribution is confirmed, not when payment is recorded
    const updatedContribution = await updateContribution(contribution.id, {
      amount_paid,
      paid_at: amount_paid > 0 ? new Date().toISOString() : null,
      status,
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { contribution: updatedContribution },
      message: 'Payment recorded successfully',
    })
  } catch (error) {
    console.error('Admin record payment error:', error)
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to record payment. Please try again.',
      },
      { status: 500 }
    )
  }
}

