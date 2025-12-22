import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { createChama } from '@/lib/db/queries/chamas'
import { addChamaMember } from '@/lib/db/queries/chama-members'
import { getSavingsAccount, createSavingsAccount } from '@/lib/db/queries/savings'
import { generateInviteCode } from '@/lib/utils/invite-code'
import { validateChamaName, validateContributionAmount } from '@/lib/utils/validation'
import type { ApiResponse } from '@/lib/types/api'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()

    const {
      name,
      description,
      chama_type,
      is_private,
      contribution_amount,
      payout_amount,
      savings_amount,
      service_fee,
      frequency,
    } = body

    const nameValidation = validateChamaName(name)
    if (!nameValidation.valid) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: nameValidation.error },
        { status: 400 }
      )
    }

    if (!chama_type || !['savings', 'merry_go_round', 'hybrid'].includes(chama_type)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid chama type' },
        { status: 400 }
      )
    }

    if (contribution_amount) {
      const amountValidation = validateContributionAmount(contribution_amount)
      if (!amountValidation.valid) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: amountValidation.error },
          { status: 400 }
        )
      }
    }

    const inviteCode = generateInviteCode()

    const chama = await createChama({
      name: name.trim(),
      description: description?.trim() || null,
      created_by: user.id,
      chama_type,
      invite_code: inviteCode,
      is_private: is_private ? 1 : 0,
      max_members: 50,
    })

    await addChamaMember(chama.id, user.id, 'admin')

    let savingsAccount = await getSavingsAccount(user.id)
    if (!savingsAccount) {
      savingsAccount = await createSavingsAccount(user.id)
    }

    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/join/${inviteCode}`

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        ...chama,
        invite_link: inviteLink,
      },
    })
  } catch (error) {
    console.error('Create chama error:', error)
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: 'Failed to create chama. Please try again.',
      },
      { status: 500 }
    )
  }
}

