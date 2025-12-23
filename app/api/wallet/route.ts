import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { getWalletTransactions, getWalletBalance } from '@/lib/db/queries/wallet'
import type { ApiResponse } from '@/lib/types/api'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const searchParams = request.nextUrl.searchParams

    const filters = {
      type: searchParams.get('type') || undefined,
      chama_id: searchParams.get('chama_id') || undefined,
      cycle_id: searchParams.get('cycle_id') || undefined,
      start_date: searchParams.get('start_date') || undefined,
      end_date: searchParams.get('end_date') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined,
    }

    const transactions = await getWalletTransactions(user.id, filters)
    const balance = await getWalletBalance(user.id)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        transactions,
        balance,
      },
    })
  } catch (error) {
    console.error('Get wallet error:', error)
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to fetch wallet transactions. Please try again.',
      },
      { status: 500 }
    )
  }
}

