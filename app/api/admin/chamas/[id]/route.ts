import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin-middleware'
import { getChamaById, updateChama } from '@/lib/db/queries/chamas'
import type { ApiResponse } from '@/lib/types/api'
import type { Chama } from '@/lib/types/chama'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params

    const chama = await getChamaById(id)
    if (!chama) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Chama not found' },
        { status: 404 }
      )
    }

    return NextResponse.json<ApiResponse<Chama>>({
      success: true,
      data: chama,
    })
  } catch (error) {
    console.error('Admin get chama error:', error)
    if (error instanceof Error && error.message.includes('redirect')) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to fetch chama. Please try again.',
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
    await requireAdmin()
    const { id } = await params
    const body = await request.json()

    const { status } = body

    if (!status || !['active', 'paused', 'closed'].includes(status)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid status. Must be "active", "paused", or "closed"' },
        { status: 400 }
      )
    }

    const updatedChama = await updateChama(id, { status })

    return NextResponse.json<ApiResponse<Chama>>({
      success: true,
      data: updatedChama,
      message: `Chama ${status === 'active' ? 'activated' : status === 'paused' ? 'paused' : 'closed'} successfully`,
    })
  } catch (error) {
    console.error('Admin update chama error:', error)
    if (error instanceof Error && error.message.includes('redirect')) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to update chama. Please try again.',
      },
      { status: 500 }
    )
  }
}

