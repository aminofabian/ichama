import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { getContributionById } from '@/lib/db/queries/contributions'
import { getCycleById } from '@/lib/db/queries/cycles'
import { getChamaMember } from '@/lib/db/queries/chama-members'
import { confirmContribution } from '@/lib/services/contribution-service'
import type { ApiResponse } from '@/lib/types/api'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params

    const contribution = await getContributionById(id)
    if (!contribution) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Contribution not found' },
        { status: 404 }
      )
    }

    const cycle = await getCycleById(contribution.cycle_id)
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
        { success: false, error: 'Only admins can confirm contributions' },
        { status: 403 }
      )
    }

    // Confirm the contribution
    const confirmedContribution = await confirmContribution(id, user.id)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { contribution: confirmedContribution },
      message: 'Contribution confirmed successfully',
    })
  } catch (error) {
    console.error('Confirm contribution error:', error)
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to confirm contribution. Please try again.',
      },
      { status: 500 }
    )
  }
}

