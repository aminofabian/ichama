import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { getChamaMembers } from '@/lib/db/queries/chama-members'
import { getChamaById } from '@/lib/db/queries/chamas'
import type { ApiResponse } from '@/lib/types/api'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request)
    const chamaId = params.id

    const chama = await getChamaById(chamaId)
    if (!chama) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Chama not found' },
        { status: 404 }
      )
    }

    const members = await getChamaMembers(chamaId)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: members,
    })
  } catch (error) {
    console.error('Get chama members error:', error)
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to fetch members',
      },
      { status: 500 }
    )
  }
}

