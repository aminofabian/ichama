import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { getContributionById, updateContribution } from '@/lib/db/queries/contributions'
import { getCycleById } from '@/lib/db/queries/cycles'
import { getChamaMember } from '@/lib/db/queries/chama-members'
import type { ApiResponse } from '@/lib/types/api'

export async function GET(
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

    // Check if user is a member
    const member = await getChamaMember(cycle.chama_id, user.id)
    if (!member) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'You are not a member of this chama' },
        { status: 403 }
      )
    }

    // Check if user owns this contribution or is admin
    if (contribution.user_id !== user.id && member.role !== 'admin') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { contribution },
    })
  } catch (error) {
    console.error('Get contribution error:', error)
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to fetch contribution. Please try again.',
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

    // Check if user is a member
    const member = await getChamaMember(cycle.chama_id, user.id)
    if (!member) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'You are not a member of this chama' },
        { status: 403 }
      )
    }

    // Only allow users to update their own contributions (unless admin)
    if (contribution.user_id !== user.id && member.role !== 'admin') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'You can only update your own contributions' },
        { status: 403 }
      )
    }

    const updatedContribution = await updateContribution(id, body)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { contribution: updatedContribution },
      message: 'Contribution updated successfully',
    })
  } catch (error) {
    console.error('Update contribution error:', error)
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update contribution. Please try again.',
      },
      { status: 500 }
    )
  }
}

