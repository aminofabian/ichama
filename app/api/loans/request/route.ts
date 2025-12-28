import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { getSavingsAccount } from '@/lib/db/queries/savings'
import { getActiveGuaranteesByUser, getActiveLoansByUser } from '@/lib/db/queries/loans'
import { createLoan, addLoanGuarantor } from '@/lib/db/queries/loans'
import { getUserById } from '@/lib/db/queries/users'
import { getChamaById } from '@/lib/db/queries/chamas'
import { getChamaMember, getChamaMembers } from '@/lib/db/queries/chama-members'
import { notifyUser } from '@/lib/services/notification-service'
import { formatCurrency } from '@/lib/utils/format'
import type { ApiResponse } from '@/lib/types/api'

const LOAN_LIMIT_THRESHOLD = 2000
const LOAN_LIMIT_MULTIPLIER = 1.1

function calculateLoanLimit(savings: number): number {
  if (savings > LOAN_LIMIT_THRESHOLD) {
    return Math.floor(savings * LOAN_LIMIT_MULTIPLIER)
  }
  return 0
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()
    const { amount, guarantorIds, chamaId } = body

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid loan amount' },
        { status: 400 }
      )
    }

    if (!chamaId || typeof chamaId !== 'string') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Chama ID is required' },
        { status: 400 }
      )
    }

    if (!Array.isArray(guarantorIds)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid guarantor IDs' },
        { status: 400 }
      )
    }

    const chama = await getChamaById(chamaId)
    if (!chama) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Chama not found' },
        { status: 404 }
      )
    }

    const member = await getChamaMember(chamaId, user.id)
    if (!member) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'You are not a member of this chama' },
        { status: 403 }
      )
    }

    const activeGuarantees = await getActiveGuaranteesByUser(user.id)
    if (activeGuarantees.length > 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'You cannot request a loan while you have active guarantees. Please wait until the loans you guaranteed are paid.',
        },
        { status: 400 }
      )
    }

    const activeLoans = await getActiveLoansByUser(user.id)
    if (activeLoans.length > 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'You already have an active loan. Please pay it off before requesting a new one.',
        },
        { status: 400 }
      )
    }

    const savingsAccount = await getSavingsAccount(user.id)
    const savingsBalance = savingsAccount?.balance || 0
    const baseLoanLimit = calculateLoanLimit(savingsBalance)

    if (baseLoanLimit === 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'You need at least 2,000 KES in savings to request a loan',
        },
        { status: 400 }
      )
    }

    const multiplier = amount / baseLoanLimit
    const minimumGuarantorsNeeded = multiplier > 1 ? Math.max(1, Math.floor(multiplier)) : 0

    if (guarantorIds.length < minimumGuarantorsNeeded) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: `You need at least ${minimumGuarantorsNeeded} guarantor${minimumGuarantorsNeeded > 1 ? 's' : ''} for this loan amount`,
        },
        { status: 400 }
      )
    }

    let guarantorContribution = 0
    const guarantorUserIds: string[] = []

    for (const guarantorId of guarantorIds) {
      const parts = guarantorId.split('-')
      if (parts.length !== 2) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Invalid guarantor ID format' },
          { status: 400 }
        )
      }

      const guarantorUserId = parts[1]
      const guarantorUser = await getUserById(guarantorUserId)
      if (!guarantorUser) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Guarantor not found' },
          { status: 400 }
        )
      }

      const guarantorGuarantees = await getActiveGuaranteesByUser(guarantorUserId)
      if (guarantorGuarantees.length > 0) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: `${guarantorUser.full_name} cannot be a guarantor as they have active guarantees`,
          },
          { status: 400 }
        )
      }

      const guarantorSavings = await getSavingsAccount(guarantorUserId)
      const guarantorSavingsBalance = guarantorSavings?.balance || 0
      const guarantorLoanLimit = calculateLoanLimit(guarantorSavingsBalance)
      guarantorContribution += guarantorLoanLimit
      guarantorUserIds.push(guarantorUserId)
    }

    const totalLoanLimit = baseLoanLimit + guarantorContribution

    if (amount > totalLoanLimit) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: `Loan amount exceeds total limit. Your limit: ${totalLoanLimit.toLocaleString()} KES`,
        },
        { status: 400 }
      )
    }

    const loan = await createLoan({
      user_id: user.id,
      chama_id: chamaId,
      amount,
      notes: `Loan request with ${guarantorIds.length} guarantor${guarantorIds.length > 1 ? 's' : ''}`,
    })

    for (const guarantorUserId of guarantorUserIds) {
      await addLoanGuarantor({
        loan_id: loan.id,
        guarantor_user_id: guarantorUserId,
      })
    }

    const chamaMembers = await getChamaMembers(chamaId)
    const admins = chamaMembers.filter((m) => m.role === 'admin')

    for (const admin of admins) {
      await notifyUser(admin.user_id, 'loan_requested', {
        title: 'New Loan Request',
        message: `${user.full_name} has requested a loan of ${formatCurrency(amount)} in ${chama.name}`,
        chama_id: chamaId,
        data: {
          loan_id: loan.id,
          user_id: user.id,
          user_name: user.full_name,
          amount,
          chama_id: chamaId,
          chama_name: chama.name,
          guarantor_count: guarantorIds.length,
        },
      })
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        message: 'Loan request submitted successfully',
        loanId: loan.id,
        loan,
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

