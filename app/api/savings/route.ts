import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { getSavingsAccount, getSavingsTransactions } from '@/lib/db/queries/savings'
import type { ApiResponse } from '@/lib/types/api'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    // Get or create savings account
    let account = await getSavingsAccount(user.id)
    if (!account) {
      const { createSavingsAccount } = await import('@/lib/db/queries/savings')
      account = await createSavingsAccount(user.id)
    }

    // Get savings transactions
    const searchParams = request.nextUrl.searchParams
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined

    const transactions = await getSavingsTransactions(user.id, limit)

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        account,
        transactions,
      },
    })
  } catch (error) {
    console.error('Get savings error:', error)
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to fetch savings. Please try again.',
      },
      { status: 500 }
    )
  }
}

