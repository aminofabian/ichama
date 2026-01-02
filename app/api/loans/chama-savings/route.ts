import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { getUserSavingsForChama } from '@/lib/db/queries/savings'
import { getUserChamas } from '@/lib/db/queries/chamas'
import type { ApiResponse } from '@/lib/types/api'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const { searchParams } = new URL(request.url)
    const chamaId = searchParams.get('chamaId')

    if (!chamaId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Chama ID is required' },
        { status: 400 }
      )
    }

    const userChamas = await getUserChamas(user.id)
    const selectedChama = userChamas.find((c) => c.id === chamaId)

    if (!selectedChama) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Chama not found or you are not a member' },
        { status: 404 }
      )
    }

    const savingsBalance = await getUserSavingsForChama(user.id, chamaId)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        savingsBalance,
        chamaId,
        chamaName: selectedChama.name,
      },
    })
  } catch (error) {
    console.error('Get chama savings error:', error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch chama savings',
      },
      { status: 500 }
    )
  }
}

