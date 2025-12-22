import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { getCycleById } from '@/lib/db/queries/cycles'
import { getChamaMember } from '@/lib/db/queries/chama-members'
import {
  getCycleContributions,
  getPeriodContributions,
  getPendingContributions,
  getContributionById,
  createContribution,
  recordContribution,
} from '@/lib/db/queries/contributions'
import type { ApiResponse } from '@/lib/types/api'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params
    const { searchParams } = new URL(request.url)

    const cycle = await getCycleById(id)
    if (!cycle) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Cycle not found' },
        { status: 404 }
      )
    }

    // Check if user is a member
    const member = await getChamaMember(cycle.chama_id, user.id)
    if (!member) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'You are not a member of this chama' },
        { status: 403 }
      )
    }

    const periodNumber = searchParams.get('period')
    const status = searchParams.get('status')

    let contributions

    if (periodNumber) {
      contributions = await getPeriodContributions(id, parseInt(periodNumber, 10))
    } else if (status === 'pending') {
      contributions = await getPendingContributions(id)
    } else {
      contributions = await getCycleContributions(id)
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { contributions },
    })
  } catch (error) {
    console.error('Get contributions error:', error)
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to fetch contributions. Please try again.',
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

    const { contribution_id, amount_paid, paid_at, notes } = body

    if (!contribution_id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Contribution ID is required' },
        { status: 400 }
      )
    }

    const contribution = await getContributionById(contribution_id)
    if (!contribution) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Contribution not found' },
        { status: 404 }
      )
    }

    // Verify contribution belongs to this cycle
    if (contribution.cycle_id !== id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid contribution' },
        { status: 400 }
      )
    }

    // Verify user owns this contribution
    if (contribution.user_id !== user.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'You can only record your own contributions' },
        { status: 403 }
      )
    }

    // Record the contribution
    const updatedContribution = await recordContribution(contribution_id, {
      amount_paid: amount_paid || contribution.amount_due,
      paid_at,
      notes,
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { contribution: updatedContribution },
      message: 'Contribution recorded successfully',
    })
  } catch (error) {
    console.error('Record contribution error:', error)
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to record contribution. Please try again.',
      },
      { status: 500 }
    )
  }
}

