import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import type { ApiResponse } from '@/lib/types/api'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()
    const { amount, guarantorIds } = body

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid loan amount' },
        { status: 400 }
      )
    }

    if (!Array.isArray(guarantorIds)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid guarantor IDs' },
        { status: 400 }
      )
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        message: 'Loan request submitted successfully',
        loanId: 'placeholder-id',
      },
    })
  } catch (error) {
    console.error('Request loan error:', error)
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to request loan',
      },
      { status: 500 }
    )
  }
}

